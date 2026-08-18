import { getApiUserId } from "@/lib/apiAuth";
import {
  deactivateChecklistItemForUser,
  listChecklistItemsForUser,
  updateChecklistItemForUser,
  type RoutineItemInput,
} from "@/lib/care/checklistCore";

export async function PATCH(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RoutineItemInput | null;
  if (!body) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    await updateChecklistItemForUser(userId, id, body);
    const items = await listChecklistItemsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deactivateChecklistItemForUser(userId, id);
    const items = await listChecklistItemsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover";
    return Response.json({ error: message }, { status: 400 });
  }
}
