import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { WISDOM_CHAPTERS } from "@/constants/wisdomPills";

export type WisdomProgressView = {
  chaptersRead: number;
  streakDays: number;
  totalChapters: number;
  // Só o próximo capítulo (chaptersRead + 1) pode ficar bloqueado — os já
  // lidos continuam sempre revisitáveis, os mais à frente nem aparecem
  // como opção ainda.
  nextChapterAvailable: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Liberado temporariamente pra ler os 8 capítulos de uma vez assim que a
// trilha inteira foi escrita, em vez de esperar uma semana real. Volte
// pra `true` quando quiser reativar o ritmo de "um capítulo por dia" —
// o streak (computeNextStreak) continua contando normalmente dos dois
// jeitos, isso só afasta o bloqueio de isNextChapterAvailable.
const DAILY_GATE_ENABLED = false;

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
  totalChapters = WISDOM_CHAPTERS.length
): boolean {
  if (chaptersRead >= totalChapters) return false;
  if (chaptersRead === 0 || lastReadDate === null) return true;
  return daysBetween(lastReadDate, today) >= 1;
}

function nextChapterAvailableNow(chaptersRead: number, lastReadDate: Date | null, today: Date): boolean {
  if (!DAILY_GATE_ENABLED) return chaptersRead < WISDOM_CHAPTERS.length;
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

function toView(row: { chaptersRead: number; streakDays: number; lastReadDate: Date | null }): WisdomProgressView {
  return {
    chaptersRead: row.chaptersRead,
    streakDays: row.streakDays,
    totalChapters: WISDOM_CHAPTERS.length,
    nextChapterAvailable: nextChapterAvailableNow(row.chaptersRead, row.lastReadDate, todayDate()),
  };
}

export async function getWisdomProgressForUser(userId: string): Promise<WisdomProgressView> {
  const row = await prisma.wisdomProgress.findUnique({ where: { userId } });
  return toView(row ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null });
}

/**
 * Marca um capítulo como concluído — só aceita o próximo da sequência
 * (chaptersRead + 1), e só se ele já estiver liberado hoje.
 */
export async function completeChapterForUser(
  userId: string,
  chapterNumber: number
): Promise<WisdomProgressView> {
  const existing = await prisma.wisdomProgress.findUnique({ where: { userId } });
  const current = existing ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null };

  if (chapterNumber !== current.chaptersRead + 1 || chapterNumber > WISDOM_CHAPTERS.length) {
    throw new Error("Esse capítulo não está disponível agora");
  }

  const today = todayDate();
  if (!nextChapterAvailableNow(current.chaptersRead, current.lastReadDate, today)) {
    throw new Error("Volte amanhã para o próximo capítulo");
  }

  const streakDays = computeNextStreak(current.lastReadDate, today, current.streakDays);

  const updated = await prisma.wisdomProgress.upsert({
    where: { userId },
    create: { userId, chaptersRead: chapterNumber, streakDays, lastReadDate: today },
    update: { chaptersRead: chapterNumber, streakDays, lastReadDate: today },
  });

  return toView(updated);
}
