/**
 * Carga inicial do conteúdo de leitura no Supabase (05/10/2026):
 * Pílulas de sabedoria + livros de Gotas de Fé, de scripts/conteudo/*.ts
 * pras tabelas ReadingBook / ReadingTopic / ReadingChapter.
 *
 * Idempotente: deixa o banco IGUAL aos arquivos (upsert de livro e
 * capítulo, recria os assuntos, apaga capítulo que não existe mais no
 * arquivo). Atenção: por isso mesmo, rodar de novo DESFAZ edições feitas
 * direto no banco depois da carga.
 *
 *   npx tsx --env-file=.env scripts/seed-reading-content.ts
 */
import { prisma } from "@/lib/prisma";
import { WISDOM_BOOK_SLUG, type ReadingBlock } from "@/lib/reading/types";
import { WISDOM_CHAPTERS, WISDOM_TOPICS } from "./conteudo/wisdomPills";
import { FAITH_BOOKS } from "./conteudo/faithDrops";

type ChapterSource = { number: number; title: string; subtitle: string; blocks: ReadingBlock[] };
type TopicSource = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firstChapter: number;
  lastChapter: number;
};

async function upsertBook(book: {
  slug: string;
  kind: "WISDOM" | "FAITH";
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  sortOrder: number;
  topics: TopicSource[];
  chapters: ChapterSource[];
}) {
  const numbers = book.chapters.map((c) => c.number);
  if (new Set(numbers).size !== numbers.length) throw new Error(`${book.slug}: capítulo repetido`);

  await prisma.$transaction(async (tx) => {
    const meta = {
      kind: book.kind,
      title: book.title,
      subtitle: book.subtitle,
      icon: book.icon,
      color: book.color,
      sortOrder: book.sortOrder,
      active: true,
    };
    await tx.readingBook.upsert({ where: { slug: book.slug }, create: { slug: book.slug, ...meta }, update: meta });

    await tx.readingTopic.deleteMany({ where: { bookSlug: book.slug } });
    if (book.topics.length > 0) {
      await tx.readingTopic.createMany({
        data: book.topics.map((t, i) => ({ bookSlug: book.slug, sortOrder: i, ...t })),
      });
    }

    for (const ch of book.chapters) {
      const data = { title: ch.title, subtitle: ch.subtitle, blocks: ch.blocks };
      await tx.readingChapter.upsert({
        where: { bookSlug_number: { bookSlug: book.slug, number: ch.number } },
        create: { bookSlug: book.slug, number: ch.number, ...data },
        update: data,
      });
    }
    await tx.readingChapter.deleteMany({ where: { bookSlug: book.slug, number: { notIn: numbers } } });
  }, { maxWait: 30_000, timeout: 180_000 });

  console.log(`${book.slug}: ${book.chapters.length} capítulos, ${book.topics.length} assuntos`);
}

async function main() {
  await upsertBook({
    slug: WISDOM_BOOK_SLUG,
    kind: "WISDOM",
    title: "Pílulas de sabedoria",
    subtitle: "Um capítulo curto por dia",
    icon: "bulb",
    color: "#f59e0b",
    sortOrder: 0,
    topics: WISDOM_TOPICS,
    chapters: WISDOM_CHAPTERS,
  });

  for (const [i, book] of FAITH_BOOKS.entries()) {
    await upsertBook({
      slug: book.slug,
      kind: "FAITH",
      title: book.title,
      subtitle: book.subtitle,
      icon: book.icon,
      color: book.color,
      sortOrder: i,
      topics: [],
      chapters: book.chapters,
    });
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("ERRO:", error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
