import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  createOrderForItems,
  parseCashTenderedCents,
  parsePaymentMethod,
  type OrderAddressInput,
} from "@/lib/orders/orderCore";
import { parseWalletDiscountCents } from "@/lib/wallet";
import type { FulfillmentType } from "@/lib/generated/prisma/client";

export async function POST(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const tracking = await prisma.medicationTracking.findUnique({ where: { id } });
  if (!tracking || tracking.userId !== userId) {
    return Response.json({ error: "Medicamento não encontrado" }, { status: 404 });
  }
  if (!tracking.codigoProduto) {
    return Response.json(
      { error: "Esse medicamento não tem um produto vinculado no catálogo pra recomprar" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const paymentMethod = parsePaymentMethod(body?.paymentMethod);
  if (!paymentMethod) {
    return Response.json({ error: "Forma de pagamento inválida" }, { status: 400 });
  }
  const fulfillmentType: FulfillmentType = body.fulfillmentType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const address: OrderAddressInput | undefined = body.address ?? undefined;
  const walletDiscountCents = parseWalletDiscountCents(body);
  const cashTenderedCents = parseCashTenderedCents(body?.cashTenderedCents);

  try {
    const { order, checkoutUrl } = await createOrderForItems(
      userId,
      [{ codigoProduto: tracking.codigoProduto, quantity: tracking.totalUnits }],
      {
        fulfillmentType,
        address,
        requestedWalletDiscountCents: walletDiscountCents,
        paymentMethod,
        cashTenderedCents,
      }
    );
    return Response.json({ order, checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível recomprar";
    return Response.json({ error: message }, { status: 400 });
  }
}
