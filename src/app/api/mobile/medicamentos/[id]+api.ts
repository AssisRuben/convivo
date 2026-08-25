import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  deactivateMedicationTracking,
  listMedicationTrackingsForUser,
} from "@/lib/medications/medicationCore";

/**
 * Preço/quantidade do medicamento antes da recompra — recomprar.tsx
 * precisa disso pra mostrar subtotal e deixar escolher quanto do saldo da
 * carteira usar, em vez de mandar o POST às cegas como fazia antes.
 */
export async function GET(request: Request, { id }: Record<string, string>) {
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

  return Response.json({
    productName: product.name,
    totalUnits: tracking.totalUnits,
    subtotalCents: product.priceCents * tracking.totalUnits,
  });
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deactivateMedicationTracking(userId, id);
    const items = await listMedicationTrackingsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover";
    return Response.json({ error: message }, { status: 400 });
  }
}
