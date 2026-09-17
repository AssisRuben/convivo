import { getApiUserId } from "@/lib/apiAuth";
import { completeChapterForUser } from "@/lib/faith/faithCore";

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { chapterNumber?: number } | null;
  if (!body?.chapterNumber) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const progress = await completeChapterForUser(userId, body.chapterNumber);
    return Response.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}
