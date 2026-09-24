import { getApiUserId } from "@/lib/apiAuth";
import { getFaithProgressForUser } from "@/lib/faith/faithCore";

/** Progresso de um livro específico — pra lista de capítulos daquele livro. */
export async function GET(request: Request, { livro }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const progress = await getFaithProgressForUser(userId, livro);
    return Response.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Livro não encontrado";
    return Response.json({ error: message }, { status: 404 });
  }
}
