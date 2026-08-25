import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { efetuarVendaTrier, getPharmacyEndereco, isTrierConfigured } from "@/lib/orders/trier";
import { createPreferenceForOrder, isMercadoPagoConfigured } from "@/lib/orders/mercadopago";
import { checkLoyaltyStampReward } from "@/lib/loyalty/loyaltyCore";
import { getWalletBalanceCents } from "@/lib/wallet";
import {
  decrementCatalogStock,
  getCatalogProductByCodigo,
  incrementCatalogStock,
} from "@/lib/catalog/catalogDb";
import { mirrorCatalogProduct } from "@/lib/catalog/catalogMirror";
import type {
  FulfillmentType,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  User,
} from "@/lib/generated/prisma/client";

export const REFERRAL_COMMISSION_RATE = 0.02;
export const VENDEDOR_COMMISSION_RATE = 0.05;

/**
 * Trava o desconto de saldo contra o que realmente existe — usada tanto na
 * criação do pedido (com o saldo de então) quanto na aprovação (com o
 * saldo relido, que pode ter mudado). Nunca confia no valor pedido sem
 * checar contra o subtotal e o saldo disponível.
 */
export function clampWalletDiscount(
  requestedCents: number,
  subtotalCents: number,
  balanceCents: number
): number {
  return Math.max(0, Math.min(requestedCents, subtotalCents, balanceCents));
}

const PAYMENT_METHODS = ["ONLINE_MP", "CARTAO_PRESENCIAL", "DINHEIRO"] as const;

/** Nunca confia no que o cliente manda sem checar contra o enum de verdade. */
export function parsePaymentMethod(value: unknown): PaymentMethod | null {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value)
    ? (value as PaymentMethod)
    : null;
}

export function parseCashTenderedCents(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : undefined;
}

export type OrderItemInput = { codigoProduto: number; quantity: number };

export type OrderAddressInput = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

export type CreateOrderOptions = {
  fulfillmentType?: FulfillmentType;
  address?: OrderAddressInput;
  requestedWalletDiscountCents?: number;
  // Obrigatório de propósito — nunca cai no @default do schema (que existe
  // só como rede de segurança de migration), pra nunca aprovar sem querer
  // um pedido que esqueceram de marcar a forma de pagamento.
  paymentMethod: PaymentMethod;
  // Só usado quando paymentMethod === "DINHEIRO".
  cashTenderedCents?: number;
};

export type CreateOrderResult = {
  order: Order;
  // Presente só quando paymentMethod === "ONLINE_MP" e a preferência foi
  // criada com sucesso — o cliente precisa abrir essa URL pra pagar.
  checkoutUrl: string | null;
};

/**
 * Cria o pedido a partir de uma lista explícita de itens (não do carrinho
 * ao vivo) — usado tanto pelo checkout normal (`createOrderFromCart`,
 * abaixo) quanto pela recompra de 1 clique de medicamento, que não deve
 * mexer no carrinho de compras do usuário. É o único lugar que resolve
 * produto: busca cada item ao vivo no catálogo real (preço, estoque,
 * elegibilidade), nunca confia em preço/estoque que o chamador já tinha
 * em mãos de antes — inclusive protege a recompra de medicamento, que
 * antes montava o pedido só com dado local sem checar nada ao vivo.
 *
 * Cartão presencial e dinheiro aprovam o pedido nesta mesma chamada — o
 * pagamento acontece fisicamente na farmácia, fora do controle do app, sem
 * painel de funcionário pra confirmar depois. Só ONLINE_MP fica PENDING,
 * esperando o webhook do Mercado Pago (ou, nesta sessão sem hospedagem
 * pública, o botão de simular pagamento).
 */
export async function createOrderForItems(
  userId: string,
  items: OrderItemInput[],
  options: CreateOrderOptions
): Promise<CreateOrderResult> {
  if (items.length === 0) {
    throw new Error("Nenhum item pra criar o pedido");
  }

  // Resolve tudo ao vivo e decrementa o estoque real (banco externo da
  // farmácia) item a item, ANTES de criar qualquer coisa localmente — é
  // essa trava condicional e atômica que impede vender mais do que existe,
  // não a transação local (que não tem como cobrir os dois bancos). Se
  // algum item falhar no meio (sem estoque, não encontrado), devolve o
  // que já tinha sido decrementado nesta mesma chamada antes de lançar.
  const resolved: { codigoProduto: number; product: Awaited<ReturnType<typeof mirrorCatalogProduct>>; quantity: number; unitPriceCents: number }[] = [];
  try {
    for (const item of items) {
      const catalogProduct = await getCatalogProductByCodigo(item.codigoProduto);
      if (!catalogProduct) {
        throw new Error(`Produto não encontrado ou indisponível (código ${item.codigoProduto})`);
      }
      const decremented = await decrementCatalogStock(item.codigoProduto, item.quantity);
      if (!decremented) {
        throw new Error(`Estoque insuficiente para ${catalogProduct.nome}`);
      }
      const mirrored = await mirrorCatalogProduct(
        catalogProduct,
        catalogProduct.estoqueAtual - item.quantity
      );
      resolved.push({
        codigoProduto: item.codigoProduto,
        product: mirrored,
        quantity: item.quantity,
        unitPriceCents: catalogProduct.precoCents,
      });
    }
  } catch (error) {
    for (const item of resolved) {
      await incrementCatalogStock(item.codigoProduto, item.quantity);
    }
    throw error;
  }

  const fulfillmentType = options.fulfillmentType ?? "PICKUP";
  const { address, paymentMethod } = options;
  const requestedWalletDiscountCents = options.requestedWalletDiscountCents ?? 0;

  const subtotalCents = resolved.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  // Desconto travado na criação — só uma "promessa": o débito de verdade
  // da carteira só acontece na aprovação (ver approveOrder), que relê o
  // saldo e pode reduzir esse valor se ele tiver sido gasto em outro
  // pedido nesse meio tempo. Nunca confia no valor pedido sem checar
  // contra o subtotal e o saldo atual.
  const balanceCents = await getWalletBalanceCents(userId);
  const walletDiscountCents = clampWalletDiscount(
    requestedWalletDiscountCents,
    subtotalCents,
    balanceCents
  );
  const totalCents = subtotalCents - walletDiscountCents;

  if (paymentMethod === "DINHEIRO") {
    const tendered = options.cashTenderedCents;
    if (tendered == null || !Number.isFinite(tendered) || tendered < totalCents) {
      for (const item of resolved) await incrementCatalogStock(item.codigoProduto, item.quantity);
      throw new Error("Valor em dinheiro informado é menor que o total do pedido");
    }
  }
  if (paymentMethod === "ONLINE_MP" && !isMercadoPagoConfigured()) {
    for (const item of resolved) await incrementCatalogStock(item.codigoProduto, item.quantity);
    throw new Error("Pagamento online indisponível no momento");
  }
  const cashTenderedCents = paymentMethod === "DINHEIRO" ? (options.cashTenderedCents ?? null) : null;

  let order: Order;
  try {
    order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId,
          subtotalCents,
          totalCents,
          walletDiscountCents,
          paymentMethod,
          cashTenderedCents,
          fulfillmentType,
          addressCep: address?.cep ?? null,
          addressLogradouro: address?.logradouro ?? null,
          addressNumero: address?.numero ?? null,
          addressBairro: address?.bairro ?? null,
          addressCidade: address?.cidade ?? null,
          addressEstado: address?.estado ?? null,
          items: {
            create: resolved.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
            })),
          },
        },
      });
    });
  } catch (error) {
    // A transação local falhou depois do estoque real já ter sido
    // decrementado lá fora — devolve tudo, best-effort.
    for (const item of resolved) await incrementCatalogStock(item.codigoProduto, item.quantity);
    throw error;
  }

  if (paymentMethod === "CARTAO_PRESENCIAL" || paymentMethod === "DINHEIRO") {
    await approveOrder(order.id);
    const approved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    return { order: approved, checkoutUrl: null };
  }

  // ONLINE_MP: cria a preferência de checkout; se falhar, rejeita o
  // pedido e devolve o estoque em vez de deixar um PENDING sem forma
  // nenhuma de ser pago.
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const preference = await createPreferenceForOrder({ id: order.id, totalCents, user });

  if (!preference.ok) {
    await rejectOrder(order.id, preference.error);
    const rejected = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    return { order: rejected, checkoutUrl: null };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { mpPreferenceId: preference.preferenceId },
  });
  return { order, checkoutUrl: preference.checkoutUrl };
}

export async function createOrderFromCart(
  userId: string,
  options: CreateOrderOptions
): Promise<CreateOrderResult> {
  const cart = await getOrCreateCart(userId);
  if (cart.items.length === 0) {
    throw new Error("Carrinho vazio");
  }

  const items: OrderItemInput[] = cart.items.map((item) => {
    if (item.product.codigoProduto == null) {
      throw new Error(`Produto "${item.product.name}" não está mais disponível`);
    }
    return { codigoProduto: item.product.codigoProduto, quantity: item.quantity };
  });

  const result = await createOrderForItems(userId, items, options);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return result;
}

type OrderWithRelations = Order & {
  user: User;
  items: (OrderItem & { product: Product })[];
};

/**
 * Registro best-effort na Trier — nunca lança. Se faltar configuração,
 * CPF do cliente, ou nenhum produto do pedido tiver `codigoProduto` (caso
 * do catálogo mock atual), grava um `trierError` explicativo em vez de
 * arriscar uma chamada malformada contra o gateway real de produção.
 */
async function syncOrderToTrier(order: OrderWithRelations): Promise<void> {
  if (!isTrierConfigured()) {
    await prisma.order.update({
      where: { id: order.id },
      data: { trierError: "Trier não configurado" },
    });
    return;
  }
  if (!order.user.cpf) {
    await prisma.order.update({
      where: { id: order.id },
      data: { trierError: "Cliente sem CPF cadastrado" },
    });
    return;
  }

  const produtos = order.items
    .filter((item) => item.product.codigoProduto != null)
    .map((item) => ({
      codigoProduto: item.product.codigoProduto!,
      nomeProduto: item.product.name,
      quantidade: item.quantity,
      valorUnitarioCents: item.unitPriceCents,
    }));
  if (produtos.length === 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: { trierError: "Nenhum produto do pedido tem codigoProduto da Trier" },
    });
    return;
  }

  try {
    const result = await efetuarVendaTrier({
      numeroPedido: order.id,
      dataPedido: order.createdAt,
      valorTotalCents: order.totalCents,
      clienteNome: order.user.name,
      clienteCpf: order.user.cpf,
      // Retirada usa o endereço da própria farmácia (obrigatório na prática
      // mesmo sem entrega, ver docs/API-SGF-EFETUAR-VENDA.md do
      // pagamentoapp); entrega de verdade fica pra quando existir seletor
      // de endereço no checkout.
      entrega: order.fulfillmentType === "DELIVERY",
      enderecoEntrega: getPharmacyEndereco()!,
      produtos,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { trierNumeroNota: result.numeroNota, trierSyncedAt: new Date(), trierError: null },
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { trierError: error instanceof Error ? error.message : "Erro desconhecido" },
    });
  }
}

type MarginItem = { unitPriceCents: number; quantity: number; product: { costCents: number | null } };

/**
 * Margem bruta do pedido (soma unitPriceCents - costCents por item, só os
 * que têm custo cadastrado) — base de cálculo das comissões de amigo e de
 * vendedor abaixo, que coexistem e usam a mesma margem cada uma com sua
 * taxa. Assinatura enxuta (só o que precisa de `items`) de propósito, pra
 * dar pra testar sem montar um Order completo.
 */
export function calculateOrderMarginCents(items: MarginItem[]): number {
  let marginCents = 0;
  for (const item of items) {
    if (item.product.costCents == null) continue;
    const itemMargin = item.unitPriceCents - item.product.costCents;
    if (itemMargin <= 0) continue;
    marginCents += itemMargin * item.quantity;
  }
  return marginCents;
}

/**
 * Comissão recorrente de 2% da margem bruta pro amigo que indicou — toda
 * compra do indicado, não só a primeira. Independente da comissão de
 * vendedor abaixo: os dois vínculos podem existir juntos no mesmo cliente.
 */
async function creditReferralCommission(order: OrderWithRelations): Promise<void> {
  if (!order.user.referredById) return;

  const commissionCents = Math.round(calculateOrderMarginCents(order.items) * REFERRAL_COMMISSION_RATE);
  if (commissionCents <= 0) return;

  await prisma.walletEntry.create({
    data: {
      userId: order.user.referredById,
      amountCents: commissionCents,
      source: "REFERRAL_PURCHASE_COMMISSION",
      description: `Comissão de 2% pela compra de ${order.user.name}`,
    },
  });
}

/**
 * Comissão recorrente de 5% da margem bruta pro vendedor vinculado ao
 * cliente — taxa maior que a de amigo (papel mais ativo, atendimento
 * presencial). Coexiste com creditReferralCommission: um cliente pode ter
 * amigo indicador E vendedor ao mesmo tempo, cada um ganha a sua parte.
 */
async function creditVendedorCommission(order: OrderWithRelations): Promise<void> {
  if (!order.user.vendedorId) return;

  const commissionCents = Math.round(calculateOrderMarginCents(order.items) * VENDEDOR_COMMISSION_RATE);
  if (commissionCents <= 0) return;

  await prisma.walletEntry.create({
    data: {
      userId: order.user.vendedorId,
      amountCents: commissionCents,
      source: "VENDEDOR_PURCHASE_COMMISSION",
      description: `Comissão de 5% pela compra de ${order.user.name}`,
    },
  });
}

/**
 * Ponto único chamado tanto pela criação de pedido presencial (cartão/
 * dinheiro, na hora), quanto pela simulação de pagamento, quanto pelo
 * webhook real do Mercado Pago — mantém Trier e comissão no mesmo lugar
 * independente de quem aprovou. Idempotente via `updateMany` com guarda
 * de status na própria query (não só um `if` de aplicação): importante
 * porque um webhook de verdade pode entregar em duplicidade sob
 * concorrência, diferente do botão de simular (uso único, manual).
 */
export async function approveOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (order.status !== "PENDING") return;

  const updated = await prisma.$transaction(async (tx) => {
    const balanceCents = await getWalletBalanceCents(order.userId, tx);
    const walletDiscountCents = clampWalletDiscount(
      order.walletDiscountCents,
      order.subtotalCents,
      balanceCents
    );
    const totalCents = order.subtotalCents - walletDiscountCents;

    const result = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "APPROVED", totalCents, walletDiscountCents },
    });
    if (result.count !== 1) return null; // outra chamada concorrente já decidiu

    if (walletDiscountCents > 0) {
      await tx.walletEntry.create({
        data: {
          userId: order.userId,
          amountCents: -walletDiscountCents,
          source: "WALLET_REDEMPTION",
          description: `Desconto de saldo aplicado no pedido ${orderId}`,
        },
      });
    }

    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });

  if (!updated) return;

  const orderForDownstream: OrderWithRelations = { ...order, ...updated };

  await syncOrderToTrier(orderForDownstream);
  await creditReferralCommission(orderForDownstream);
  await creditVendedorCommission(orderForDownstream);
  await checkLoyaltyStampReward(order.userId);
}

/**
 * Simétrica a approveOrder — usada quando um pagamento ONLINE_MP falha
 * (preferência não criada) ou o Mercado Pago reporta rejeitado/cancelado.
 * Devolve o estoque decrementado na criação — local E o real (banco
 * externo, já que por essa altura ele já tinha sido decrementado lá) —
 * já que nesse ponto o dinheiro nunca chegou a mudar de mãos (diferente
 * de uma falha de sincronização com a Trier, que acontece depois da venda
 * já feita).
 */
export async function rejectOrder(orderId: string, reason: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (order.status !== "PENDING") return;

  const didReject = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "REJECTED", mpError: reason },
    });
    if (result.count !== 1) return false;

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    return true;
  });

  if (!didReject) return;

  for (const item of order.items) {
    if (item.product.codigoProduto != null) {
      await incrementCatalogStock(item.product.codigoProduto, item.quantity);
    }
  }
}
