import { getApiUserId } from "@/lib/apiAuth";
import { getThreadForStaff, sendStaffMessage } from "@/lib/chat/chatCore";

/** Gestor: uma conversa com um cliente. */
export async function GET(request: Request, { threadId }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    return Response.json(await getThreadForStaff(userId, threadId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir";
    return Response.json({ error: message }, { status: 403 });
  }
}

/** Gestor responde ao cliente. Body: { text }. */
export async function POST(request: Request, { threadId }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    await sendStaffMessage(userId, threadId, body?.text);
    return Response.json(await getThreadForStaff(userId, threadId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar";
    return Response.json({ error: message }, { status: 400 });
  }
}
