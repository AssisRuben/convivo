import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { createOrderForItems, type OrderAddressInput } from "@/lib/orders/orderCore";
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

  const product = await prisma.product.findUnique({
    where: { codigoProduto: tracking.codigoProduto },
  });
  if (!product) {
    return Response.json(
      { error: "Produto não encontrado no catálogo — ainda não sincronizado com a Trier" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const fulfillmentType: FulfillmentType = body.fulfillmentType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const address: OrderAddressInput | undefined = body.address ?? undefined;

  try {
    const order = await createOrderForItems(
      userId,
      [{ productId: product.id, quantity: tracking.totalUnits, unitPriceCents: product.priceCents }],
      fulfillmentType,
      address
    );
    return Response.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível recomprar";
    return Response.json({ error: message }, { status: 400 });
  }
}
