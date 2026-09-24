import { getApiUserId } from "@/lib/apiAuth";
import { getFaithBooksSummaryForUser } from "@/lib/faith/faithCore";

/** Hub de "Gotas de Fé" — um resumo por livro (Provérbios, Marcos, ...). */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const books = await getFaithBooksSummaryForUser(userId);
  return Response.json({ books });
}
