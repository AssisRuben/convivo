import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  createOrderFromCart,
  parseCashTenderedCents,
  parsePaymentMethod,
  type OrderAddressInput,
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

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paymentMethod = parsePaymentMethod(body?.paymentMethod);
  if (!paymentMethod) {
    return Response.json({ error: "Forma de pagamento inválida" }, { status: 400 });
  }
  const fulfillmentType: FulfillmentType = body.fulfillmentType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const address: OrderAddressInput | undefined = body.address ?? undefined;
  const walletDiscountCents = parseWalletDiscountCents(body);
  const cashTenderedCents = parseCashTenderedCents(body?.cashTenderedCents);

  try {
    const { order, checkoutUrl } = await createOrderFromCart(userId, {
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
