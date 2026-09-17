import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { FAITH_CHAPTERS } from "@/constants/faithDrops";

export type FaithProgressView = {
  chaptersRead: number;
  streakDays: number;
  totalChapters: number;
  nextChapterAvailable: boolean;
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
  totalChapters = FAITH_CHAPTERS.length
): boolean {
  if (chaptersRead >= totalChapters) return false;
  if (chaptersRead === 0 || lastReadDate === null) return true;
  return daysBetween(lastReadDate, today) >= 1;
}

function nextChapterAvailableNow(chaptersRead: number, lastReadDate: Date | null, today: Date): boolean {
  if (!DAILY_GATE_ENABLED) return chaptersRead < FAITH_CHAPTERS.length;
  return isNextChapterAvailable(chaptersRead, lastReadDate, today);
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

function toView(row: { chaptersRead: number; streakDays: number; lastReadDate: Date | null }): FaithProgressView {
  return {
    chaptersRead: row.chaptersRead,
    streakDays: row.streakDays,
    totalChapters: FAITH_CHAPTERS.length,
    nextChapterAvailable: nextChapterAvailableNow(row.chaptersRead, row.lastReadDate, todayDate()),
  };
}

export async function getFaithProgressForUser(userId: string): Promise<FaithProgressView> {
  const row = await prisma.faithProgress.findUnique({ where: { userId } });
  return toView(row ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null });
}

/**
 * Marca um capítulo como concluído — só aceita o próximo da sequência
 * (chaptersRead + 1), e só se ele já estiver liberado hoje.
 */
export async function completeChapterForUser(
  userId: string,
  chapterNumber: number
): Promise<FaithProgressView> {
  const existing = await prisma.faithProgress.findUnique({ where: { userId } });
  const current = existing ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null };

  if (chapterNumber !== current.chaptersRead + 1 || chapterNumber > FAITH_CHAPTERS.length) {
    throw new Error("Esse capítulo não está disponível agora");
  }

  const today = todayDate();
  if (!nextChapterAvailableNow(current.chaptersRead, current.lastReadDate, today)) {
    throw new Error("Volte amanhã para o próximo capítulo");
  }

  const streakDays = computeNextStreak(current.lastReadDate, today, current.streakDays);

  const updated = await prisma.faithProgress.upsert({
    where: { userId },
    create: { userId, chaptersRead: chapterNumber, streakDays, lastReadDate: today },
    update: { chaptersRead: chapterNumber, streakDays, lastReadDate: today },
  });

  return toView(updated);
}
