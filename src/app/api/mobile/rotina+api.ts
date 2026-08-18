import { getApiUserId } from "@/lib/apiAuth";
import {
  createChecklistItemForUser,
  listChecklistItemsForUser,
  type RoutineItemInput,
} from "@/lib/care/checklistCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const items = await listChecklistItemsForUser(userId);
  return Response.json({ items });
}

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RoutineItemInput | null;
  if (!body) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    await createChecklistItemForUser(userId, body);
    const items = await listChecklistItemsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}
