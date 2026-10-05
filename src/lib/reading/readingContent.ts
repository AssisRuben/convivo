import { prisma } from "@/lib/prisma";
import type {
  ReadingBlock,
  ReadingBookView,
  ReadingChapterView,
  ReadingKind,
} from "@/lib/reading/types";

/**
 * Conteúdo de leitura (tópicos de Pílulas de sabedoria + livros de Gotas
 * de Fé), lido das tabelas ReadingBook/ReadingChapter.
 *
 * Cache em memória por livro: o conteúdo quase nunca muda e é lido a cada
 * abertura de tela, a cada "concluir capítulo" e pelo cron de lembretes —
 * sem cache, cada um desses viraria uma ida ao Supabase remoto. Edição
 * feita direto no banco aparece em até CACHE_TTL_MS.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

type BookFull = ReadingBookView & { chapterBlocks: Map<number, ReadingBlock[]> };

const cache = new Map<string, { at: number; book: BookFull | null }>();
let listCache: { at: number; slugs: { slug: string; kind: ReadingKind }[] } | null = null;

function fresh(at: number): boolean {
  return Date.now() - at < CACHE_TTL_MS;
}

async function loadBook(slug: string): Promise<BookFull | null> {
  const hit = cache.get(slug);
  if (hit && fresh(hit.at)) return hit.book;

  const row = await prisma.readingBook.findFirst({
    where: { slug, active: true },
    include: { chapters: { orderBy: { number: "asc" } } },
  });

  const book: BookFull | null = row
    ? {
        slug: row.slug,
        kind: row.kind,
        title: row.title,
        subtitle: row.subtitle,
        icon: row.icon,
        color: row.color,
        chapters: row.chapters.map((c) => ({ number: c.number, title: c.title, subtitle: c.subtitle })),
        chapterBlocks: new Map(row.chapters.map((c) => [c.number, c.blocks as ReadingBlock[]])),
      }
    : null;

  cache.set(slug, { at: Date.now(), book });
  return book;
}

/** Livro com a lista de capítulos (sem o texto) — pra tela de lista. */
export async function getReadingBook(slug: string): Promise<ReadingBookView | null> {
  const book = await loadBook(slug);
  if (!book) return null;
  const { chapterBlocks: _blocks, ...view } = book;
  return view;
}

/** Um capítulo com o texto — pra tela de leitura. */
export async function getReadingChapter(slug: string, number: number): Promise<ReadingChapterView | null> {
  const book = await loadBook(slug);
  const summary = book?.chapters.find((c) => c.number === number);
  if (!book || !summary) return null;
  return { ...summary, blocks: book.chapterBlocks.get(number) ?? [] };
}

/** Quantos capítulos o livro tem (0 se não existir/inativo). */
export async function getReadingChapterCount(slug: string): Promise<number> {
  return (await loadBook(slug))?.chapters.length ?? 0;
}

/** Livros ativos de um tipo, na ordem de exibição (hub de Pílulas ou de Gotas). */
export async function listReadingBooks(kind: ReadingKind): Promise<ReadingBookView[]> {
  if (!listCache || !fresh(listCache.at)) {
    const rows = await prisma.readingBook.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      select: { slug: true, kind: true },
    });
    listCache = { at: Date.now(), slugs: rows };
  }
  const books = await Promise.all(
    listCache.slugs.filter((b) => b.kind === kind).map((b) => getReadingBook(b.slug))
  );
  return books.filter((b): b is ReadingBookView => b !== null);
}
