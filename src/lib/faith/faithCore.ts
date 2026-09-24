import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { FAITH_BOOKS, getFaithBook } from "@/constants/faithDrops";

export type FaithProgressView = {
  bookSlug: string;
  chaptersRead: number;
  streakDays: number;
  totalChapters: number;
  nextChapterAvailable: boolean;
};

export type FaithBookSummary = {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  chaptersRead: number;
  totalChapters: number;
  streakDays: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Um capítulo por dia — combinado com o lembrete diário (ver
// dispatchDueFaithReminders em lib/reminders/dispatchCore.ts).
const DAILY_GATE_ENABLED = true;

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/**
 * Um capítulo por dia: o próximo só libera numa data diferente da última
 * leitura (ou de cara, se ainda não leu nenhum). Pura e sempre com a
 * regra real (mesmo com DAILY_GATE_ENABLED desligado) — dá pra testar
 * sem Prisma; o bypass temporário fica só nos pontos de uso abaixo.
 */
export function isNextChapterAvailable(
  chaptersRead: number,
  lastReadDate: Date | null,
  today: Date,
  totalChapters: number
): boolean {
  if (chaptersRead >= totalChapters) return false;
  if (chaptersRead === 0 || lastReadDate === null) return true;
  return daysBetween(lastReadDate, today) >= 1;
}

function nextChapterAvailableNow(
  chaptersRead: number,
  lastReadDate: Date | null,
  today: Date,
  totalChapters: number
): boolean {
  if (!DAILY_GATE_ENABLED) return chaptersRead < totalChapters;
  return isNextChapterAvailable(chaptersRead, lastReadDate, today, totalChapters);
}

/**
 * Streak sobe 1 se a última leitura foi exatamente ontem, reseta pra 1
 * se ficou mais de um dia sem ler (não impede continuar, só reinicia a
 * contagem de dias seguidos).
 */
export function computeNextStreak(lastReadDate: Date | null, today: Date, currentStreak: number): number {
  if (lastReadDate === null) return 1;
  return daysBetween(lastReadDate, today) === 1 ? currentStreak + 1 : 1;
}

function toView(
  bookSlug: string,
  totalChapters: number,
  row: { chaptersRead: number; streakDays: number; lastReadDate: Date | null }
): FaithProgressView {
  return {
    bookSlug,
    chaptersRead: row.chaptersRead,
    streakDays: row.streakDays,
    totalChapters,
    nextChapterAvailable: nextChapterAvailableNow(row.chaptersRead, row.lastReadDate, todayDate(), totalChapters),
  };
}

export async function getFaithProgressForUser(userId: string, bookSlug: string): Promise<FaithProgressView> {
  const book = getFaithBook(bookSlug);
  if (!book) throw new Error("Livro não encontrado");

  const row = await prisma.faithProgress.findUnique({ where: { userId_bookSlug: { userId, bookSlug } } });
  return toView(bookSlug, book.chapters.length, row ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null });
}

/** Resumo de todos os livros pro hub de "Gotas de Fé" — um card por livro. */
export async function getFaithBooksSummaryForUser(userId: string): Promise<FaithBookSummary[]> {
  const rows = await prisma.faithProgress.findMany({ where: { userId } });
  const byBookSlug = new Map(rows.map((row) => [row.bookSlug, row]));

  return FAITH_BOOKS.map((book) => {
    const row = byBookSlug.get(book.slug);
    return {
      slug: book.slug,
      title: book.title,
      subtitle: book.subtitle,
      icon: book.icon,
      color: book.color,
      chaptersRead: row?.chaptersRead ?? 0,
      totalChapters: book.chapters.length,
      streakDays: row?.streakDays ?? 0,
    };
  });
}

/**
 * Marca um capítulo como concluído — só aceita o próximo da sequência
 * (chaptersRead + 1) daquele livro, e só se ele já estiver liberado hoje.
 */
export async function completeChapterForUser(
  userId: string,
  bookSlug: string,
  chapterNumber: number
): Promise<FaithProgressView> {
  const book = getFaithBook(bookSlug);
  if (!book) throw new Error("Livro não encontrado");

  const existing = await prisma.faithProgress.findUnique({ where: { userId_bookSlug: { userId, bookSlug } } });
  const current = existing ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null };

  if (chapterNumber !== current.chaptersRead + 1 || chapterNumber > book.chapters.length) {
    throw new Error("Esse capítulo não está disponível agora");
  }

  const today = todayDate();
  if (!nextChapterAvailableNow(current.chaptersRead, current.lastReadDate, today, book.chapters.length)) {
    throw new Error("Volte amanhã para o próximo capítulo");
  }

  const streakDays = computeNextStreak(current.lastReadDate, today, current.streakDays);

  const updated = await prisma.faithProgress.upsert({
    where: { userId_bookSlug: { userId, bookSlug } },
    create: { userId, bookSlug, chaptersRead: chapterNumber, streakDays, lastReadDate: today },
    update: { chaptersRead: chapterNumber, streakDays, lastReadDate: today },
  });

  return toView(bookSlug, book.chapters.length, updated);
}
