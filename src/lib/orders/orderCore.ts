import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { efetuarVendaTrier, getPharmacyEndereco, isTrierConfigured } from "@/lib/orders/trier";
import { checkLoyaltyStampReward } from "@/lib/loyalty/loyaltyCore";
import type {
  FulfillmentType,
  Order,
  OrderItem,
  Product,
  User,
} from "@/lib/generated/prisma/client";

const REFERRAL_COMMISSION_RATE = 0.02;

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
  address?: OrderAddressInput
): Promise<Order> {
  if (items.length === 0) {
    throw new Error("Nenhum item pra criar o pedido");
  }

  const totalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        totalCents,
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
  fulfillmentType: FulfillmentType = "PICKUP"
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
    fulfillmentType
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
 * Comissão recorrente de 2% da margem bruta pro indicador — toda compra do
 * indicado, não só a primeira. Itens sem `costCents` são pulados (margem
 * desconhecida não é estimada).
 */
async function creditReferralCommission(order: OrderWithRelations): Promise<void> {
  if (!order.user.referredById) return;

  let marginCents = 0;
  for (const item of order.items) {
    if (item.product.costCents == null) continue;
    const itemMargin = item.unitPriceCents - item.product.costCents;
    if (itemMargin <= 0) continue;
    marginCents += itemMargin * item.quantity;
  }
  const commissionCents = Math.round(marginCents * REFERRAL_COMMISSION_RATE);
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

  await prisma.order.update({ where: { id: orderId }, data: { status: "APPROVED" } });

  await syncOrderToTrier(order);
  await creditReferralCommission(order);
  await checkLoyaltyStampReward(order.userId);
}
