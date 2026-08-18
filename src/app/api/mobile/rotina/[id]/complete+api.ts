import { getApiUserId } from "@/lib/apiAuth";
import {
  completeChecklistItemForUser,
  listChecklistItemsForUser,
  uncompleteChecklistItemForUser,
} from "@/lib/care/checklistCore";

export async function POST(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await completeChecklistItemForUser(userId, id);
    const items = await listChecklistItemsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível marcar";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await uncompleteChecklistItemForUser(userId, id);
    const items = await listChecklistItemsForUser(userId);
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível desmarcar";
    return Response.json({ error: message }, { status: 400 });
  }
}
