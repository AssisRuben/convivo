import { getApiUserId } from "@/lib/apiAuth";
import {
  createChecklistItemForUser,
  getOverallRoutineStreak,
  listChecklistItemsForUser,
  type RoutineItemInput,
} from "@/lib/care/checklistCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [items, streakDays] = await Promise.all([
    listChecklistItemsForUser(userId),
    getOverallRoutineStreak(userId),
  ]);
  return Response.json({ items, streakDays });
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
    const [items, streakDays] = await Promise.all([
      listChecklistItemsForUser(userId),
      getOverallRoutineStreak(userId),
    ]);
    return Response.json({ items, streakDays });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}
