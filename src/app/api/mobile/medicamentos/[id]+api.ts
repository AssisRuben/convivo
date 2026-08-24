import { getApiUserId } from "@/lib/apiAuth";
import {
  deactivateMedicationTracking,
  listMedicationTrackingsForUser,
} from "@/lib/medications/medicationCore";

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
