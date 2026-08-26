import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  createOrderForItems,
  parseCashTenderedCents,
  parsePaymentMethod,
  type OrderAddressInput,
  type OrderItemInput,
} from "@/lib/orders/orderCore";
import { parseWalletDiscountCents } from "@/lib/wallet";
import type { FulfillmentType } from "@/lib/generated/prisma/client";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ orders });
}

function parseItems(raw: unknown): OrderItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const items: OrderItemInput[] = [];
  for (const entry of raw) {
    const codigoProduto = Number(entry?.codigoProduto);
    const quantity = Number(entry?.quantity);
    if (!Number.isFinite(codigoProduto) || !Number.isInteger(quantity) || quantity <= 0) {
      return null;
    }
    items.push({ codigoProduto, quantity });
  }
  return items;
}

// O carrinho vive só no dispositivo (ver lib/cartState.tsx) — nunca é
// persistido no servidor enquanto está sendo montado. Aqui é o único
// ponto em que ele fala com o banco: recebe a lista final e cria o
// pedido, resolvendo preço/estoque ao vivo (createOrderForItems), nunca
// confiando no preço que o cliente mandou (nem manda, só codigoProduto e
// quantidade).
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const items = parseItems(body?.items);
  if (!items) {
    return Response.json({ error: "Carrinho vazio ou inválido" }, { status: 400 });
  }

  const paymentMethod = parsePaymentMethod(body?.paymentMethod);
  if (!paymentMethod) {
    return Response.json({ error: "Forma de pagamento inválida" }, { status: 400 });
  }
  const fulfillmentType: FulfillmentType = body.fulfillmentType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const address: OrderAddressInput | undefined = body.address ?? undefined;
  const walletDiscountCents = parseWalletDiscountCents(body);
  const cashTenderedCents = parseCashTenderedCents(body?.cashTenderedCents);

  try {
    const { order, checkoutUrl } = await createOrderForItems(userId, items, {
      fulfillmentType,
      address,
      requestedWalletDiscountCents: walletDiscountCents,
      paymentMethod,
      cashTenderedCents,
    });
    return Response.json({ order, checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o pedido";
    return Response.json({ error: message }, { status: 400 });
  }
}
