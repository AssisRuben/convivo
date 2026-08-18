import { getApiUserId } from "@/lib/apiAuth";
import { toggleLikeForUser } from "@/lib/timeline/feedCore";

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const itemKey = body?.itemKey;
  if (typeof itemKey !== "string" || !itemKey) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const liked = await toggleLikeForUser(userId, itemKey);
    return Response.json({ liked });
  } catch {
    return Response.json({ error: "Sem permissão pra curtir esse item" }, { status: 403 });
  }
}
