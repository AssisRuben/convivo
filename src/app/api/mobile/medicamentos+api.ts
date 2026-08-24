import { getApiUserId } from "@/lib/apiAuth";
import {
  createMedicationTracking,
  listMedicationTrackingsForUser,
} from "@/lib/medications/medicationCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const items = await listMedicationTrackingsForUser(userId);
  return Response.json({ items });
}

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const input = await request.json();
    await createMedicationTracking(userId, input);
    const items = await listMedicationTrackingsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}
