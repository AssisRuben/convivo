import { getApiUserId } from "@/lib/apiAuth";
import {
  getCustomerChat,
  isGestor,
  listThreadsForStaff,
  sendCustomerMessage,
} from "@/lib/chat/chatCore";

/** Aba Conversa: o cliente recebe a conversa dele; o gestor, a lista de
 * conversas de todos os clientes. */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (await isGestor(userId)) {
    return Response.json({ role: "gestor", threads: await listThreadsForStaff(userId) });
  }
  return Response.json({ role: "cliente", ...(await getCustomerChat(userId)) });
}

/** O cliente manda uma mensagem pra farmácia. Body: { text }. */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    if (await isGestor(userId)) throw new Error("Gestor responde dentro de cada conversa");
    const body = await request.json().catch(() => ({}));
    await sendCustomerMessage(userId, body?.text);
    return Response.json({ role: "cliente", ...(await getCustomerChat(userId)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar";
    return Response.json({ error: message }, { status: 400 });
  }
}
