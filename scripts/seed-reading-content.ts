/**
 * Carga inicial do conteúdo de leitura no Supabase (05/10/2026): tópicos
 * de Pílulas de sabedoria + livros de Gotas de Fé, de scripts/conteudo/*.ts
 * pras tabelas ReadingBook / ReadingChapter. Cada tópico de Pílulas e cada
 * livro de Gotas é um ReadingBook (trilha própria, capítulos a partir de 1).
 *
 * Idempotente: deixa o banco IGUAL aos arquivos (upsert de livro e
 * capítulo, apaga capítulo que não existe mais no arquivo). Atenção: por
 * isso mesmo, rodar de novo DESFAZ edições feitas direto no banco depois.
 *
 *   npx tsx --env-file=.env scripts/seed-reading-content.ts
 */
import { prisma } from "@/lib/prisma";
import type { ReadingBlock, ReadingKind } from "@/lib/reading/types";
import { WISDOM_TOPICS } from "./conteudo/wisdomPills";
import { FAITH_BOOKS } from "./conteudo/faithDrops";

type BookSource = {
  slug: string;
  kind: ReadingKind;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  sortOrder: number;
  chapters: { number: number; title: string; subtitle: string; blocks: ReadingBlock[] }[];
};

async function upsertBook(book: BookSource) {
  const numbers = book.chapters.map((c) => c.number);
  if (new Set(numbers).size !== numbers.length) throw new Error(`${book.slug}: capítulo repetido`);

  await prisma.$transaction(
    async (tx) => {
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

      for (const ch of book.chapters) {
        const data = { title: ch.title, subtitle: ch.subtitle, blocks: ch.blocks };
        await tx.readingChapter.upsert({
          where: { bookSlug_number: { bookSlug: book.slug, number: ch.number } },
          create: { bookSlug: book.slug, number: ch.number, ...data },
          update: data,
        });
      }
      await tx.readingChapter.deleteMany({ where: { bookSlug: book.slug, number: { notIn: numbers } } });
    },
    { maxWait: 30_000, timeout: 180_000 }
  );

  console.log(`${book.kind} ${book.slug}: ${book.chapters.length} capítulos`);
}

async function main() {
  const books: BookSource[] = [
    ...WISDOM_TOPICS.map((t, i) => ({ ...t, kind: "WISDOM" as const, sortOrder: i })),
    ...FAITH_BOOKS.map((b, i) => ({ ...b, kind: "FAITH" as const, sortOrder: i })),
  ];
  for (const book of books) await upsertBook(book);

  // Livro que saiu dos arquivos (ex.: o "pilulas-sabedoria" único da 1ª
  // carga, antes de Pílulas virar tópicos) — desativa em vez de apagar.
  const { count } = await prisma.readingBook.updateMany({
    where: { slug: { notIn: books.map((b) => b.slug) }, active: true },
    data: { active: false },
  });
  if (count > 0) console.log(`${count} livro(s) fora dos arquivos desativado(s)`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("ERRO:", error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
