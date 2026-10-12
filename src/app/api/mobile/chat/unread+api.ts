import { getApiUserId } from "@/lib/apiAuth";
import { getChatUnread } from "@/lib/chat/chatCore";

/** Selo da aba Conversa. */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  return Response.json({ unread: await getChatUnread(userId) });
}
