import { getApiUserId } from "@/lib/apiAuth";
import { addMedicationStock, listMedicationTrackingsForUser } from "@/lib/medications/medicationCore";

/** "Comprei mais": { units } comprimidos somados ao que deve restar hoje. */
export async function POST(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await addMedicationStock(userId, id, Number(body?.units));
    const items = await listMedicationTrackingsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}
