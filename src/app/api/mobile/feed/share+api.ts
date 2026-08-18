import { getApiUserId } from "@/lib/apiAuth";
import { shareAchievementForUser, unshareAchievementForUser } from "@/lib/timeline/feedCore";

async function getEventId(request: Request): Promise<string | null> {
  const body = await request.json().catch(() => null);
  const eventId = body?.eventId;
  return typeof eventId === "string" && eventId ? eventId : null;
}

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const eventId = await getEventId(request);
  if (!eventId) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  try {
    await shareAchievementForUser(userId, eventId);
    return Response.json({ shared: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível compartilhar";
    return Response.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const eventId = await getEventId(request);
  if (!eventId) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  try {
    await unshareAchievementForUser(userId, eventId);
    return Response.json({ shared: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível alterar";
    return Response.json({ error: message }, { status: 403 });
  }
}
