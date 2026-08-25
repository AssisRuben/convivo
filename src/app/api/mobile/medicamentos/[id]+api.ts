import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  deactivateMedicationTracking,
  listMedicationTrackingsForUser,
} from "@/lib/medications/medicationCore";
import { getCatalogProductByCodigo } from "@/lib/catalog/catalogDb";

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

  // Ao vivo, não o espelho local — preview precisa refletir preço/estoque
  // reais, não o que ficou salvo da última vez que alguém tocou nesse
  // produto (mesmo bug de frescor que existia antes desta mudança).
  const catalogProduct = await getCatalogProductByCodigo(tracking.codigoProduto);
  if (!catalogProduct) {
    return Response.json(
      { error: "Produto não encontrado no catálogo ou indisponível no momento" },
      { status: 400 }
    );
  }
  if (catalogProduct.estoqueAtual < tracking.totalUnits) {
    return Response.json(
      { error: `Estoque insuficiente — restam ${catalogProduct.estoqueAtual} unidade(s)` },
      { status: 400 }
    );
  }

  return Response.json({
    productName: catalogProduct.nome,
    totalUnits: tracking.totalUnits,
    subtotalCents: catalogProduct.precoCents * tracking.totalUnits,
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
