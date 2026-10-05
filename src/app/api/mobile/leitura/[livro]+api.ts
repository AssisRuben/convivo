import { getApiUserId } from "@/lib/apiAuth";
import { getReadingBook } from "@/lib/reading/readingContent";

/**
 * Livro de leitura (Pílulas de sabedoria ou um livro de Gotas de Fé) com a
 * lista de capítulos — só títulos, sem o texto. O texto de cada capítulo
 * vem de leitura/[livro]/[numero], sob demanda.
 */
export async function GET(request: Request, { livro }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const book = await getReadingBook(livro);
  if (!book) {
    return Response.json({ error: "Livro não encontrado" }, { status: 404 });
  }
  return Response.json(book);
}
