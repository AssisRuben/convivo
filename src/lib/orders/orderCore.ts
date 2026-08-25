import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { efetuarVendaTrier, getPharmacyEndereco, isTrierConfigured } from "@/lib/orders/trier";
import { checkLoyaltyStampReward } from "@/lib/loyalty/loyaltyCore";
import { getWalletBalanceCents } from "@/lib/wallet";
import type {
  FulfillmentType,
  Order,
  OrderItem,
  Product,
  User,
} from "@/lib/generated/prisma/client";

const REFERRAL_COMMISSION_RATE = 0.02;
const VENDEDOR_COMMISSION_RATE = 0.05;

export type OrderItemInput = { productId: string; quantity: number; unitPriceCents: number };

export type OrderAddressInput = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

/**
 * Cria o pedido a partir de uma lista explícita de itens (não do carrinho
 * ao vivo) — usado tanto pelo checkout normal (`createOrderFromCart`,
 * abaixo) quanto pela recompra de 1 clique de medicamento, que não deve
 * mexer no carrinho de compras do usuário.
 */
export async function createOrderForItems(
  userId: string,
  items: OrderItemInput[],
  fulfillmentType: FulfillmentType = "PICKUP",
  address?: OrderAddressInput,
  requestedWalletDiscountCents = 0
): Promise<Order> {
  if (items.length === 0) {
    throw new Error("Nenhum item pra criar o pedido");
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  // Desconto travado na criação — só uma "promessa": o débito de verdade
  // da carteira só acontece na aprovação (ver approveOrder), que relê o
  // saldo e pode reduzir esse valor se ele tiver sido gasto em outro
  // pedido nesse meio tempo. Nunca confia no valor pedido sem checar
  // contra o subtotal e o saldo atual.
  const balanceCents = await getWalletBalanceCents(userId);
  const walletDiscountCents = Math.max(
    0,
    Math.min(requestedWalletDiscountCents, subtotalCents, balanceCents)
  );
  const totalCents = subtotalCents - walletDiscountCents;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        subtotalCents,
        totalCents,
        walletDiscountCents,
        fulfillmentType,
        addressCep: address?.cep ?? null,
        addressLogradouro: address?.logradouro ?? null,
        addressNumero: address?.numero ?? null,
        addressBairro: address?.bairro ?? null,
        addressCidade: address?.cidade ?? null,
        addressEstado: address?.estado ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
        },
      },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return order;
  });
}

export async function createOrderFromCart(
  userId: string,
  fulfillmentType: FulfillmentType = "PICKUP",
  requestedWalletDiscountCents = 0
): Promise<Order> {
  const cart = await getOrCreateCart(userId);
  if (cart.items.length === 0) {
    throw new Error("Carrinho vazio");
  }

  const order = await createOrderForItems(
    userId,
    cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.product.priceCents,
    })),
    fulfillmentType,
    undefined,
    requestedWalletDiscountCents
  );

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return order;
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

/**
 * Margem bruta do pedido (soma unitPriceCents - costCents por item, só os
 * que têm custo cadastrado) — base de cálculo das comissões de amigo e de
 * vendedor abaixo, que coexistem e usam a mesma margem cada uma com sua
 * taxa.
 */
function calculateOrderMarginCents(order: OrderWithRelations): number {
  let marginCents = 0;
  for (const item of order.items) {
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

  const commissionCents = Math.round(calculateOrderMarginCents(order) * REFERRAL_COMMISSION_RATE);
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

  const commissionCents = Math.round(calculateOrderMarginCents(order) * VENDEDOR_COMMISSION_RATE);
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
 * Ponto único chamado tanto pela simulação de pagamento (hoje) quanto pelo
 * webhook real do Mercado Pago (quando existir) — mantém Trier e comissão
 * no mesmo lugar independente de quem aprovou. Idempotente: só age se o
 * pedido ainda estiver PENDING, pra suportar retry de webhook sem creditar
 * comissão em duplicidade.
 */
export async function approveOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (order.status !== "PENDING") return;

  // Relê o saldo e o débito na mesma transação — o valor pedido na
  // criação (order.walletDiscountCents) pode ter ficado desatualizado se
  // o cliente gastou saldo em outro pedido nesse meio tempo; aqui trava
  // no que realmente existe agora, nunca no que foi prometido antes.
  const updated = await prisma.$transaction(async (tx) => {
    const balanceCents = await getWalletBalanceCents(order.userId, tx);
    const walletDiscountCents = Math.max(0, Math.min(order.walletDiscountCents, balanceCents));
    const totalCents = order.subtotalCents - walletDiscountCents;

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "APPROVED", totalCents, walletDiscountCents },
    });

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

    return updatedOrder;
  });

  const orderForDownstream: OrderWithRelations = { ...order, ...updated };

  await syncOrderToTrier(orderForDownstream);
  await creditReferralCommission(orderForDownstream);
  await creditVendedorCommission(orderForDownstream);
  await checkLoyaltyStampReward(order.userId);
}
