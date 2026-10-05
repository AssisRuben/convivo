import { getApiUserId } from "@/lib/apiAuth";
import { getWisdomProgressForUser } from "@/lib/wisdom/wisdomCore";

/** Progresso de um tópico específico — pra lista de capítulos daquele tópico. */
export async function GET(request: Request, { topico }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const progress = await getWisdomProgressForUser(userId, topico);
    return Response.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tópico não encontrado";
    return Response.json({ error: message }, { status: 404 });
  }
}
