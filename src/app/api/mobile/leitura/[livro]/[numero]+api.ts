import { getApiUserId } from "@/lib/apiAuth";
import { getReadingChapter } from "@/lib/reading/readingContent";

/** Um capítulo com o texto (blocos) — tela de leitura. */
export async function GET(request: Request, { livro, numero }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const chapter = await getReadingChapter(livro, Number(numero));
  if (!chapter) {
    return Response.json({ error: "Capítulo não encontrado" }, { status: 404 });
  }
  return Response.json(chapter);
}
