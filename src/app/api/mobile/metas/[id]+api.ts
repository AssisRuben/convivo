import { getApiUserId } from "@/lib/apiAuth";
import { deleteGoalForUser, getGoalDetailForUser } from "@/lib/goals/goalCore";

export async function GET(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const goal = await getGoalDetailForUser(userId, id);
    return Response.json({ goal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta não encontrada";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deleteGoalForUser(userId, id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover a meta";
    return Response.json({ error: message }, { status: 400 });
  }
}
