import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { WISDOM_TOPICS, getWisdomTopic } from "@/constants/wisdomPills";

export type WisdomProgressView = {
  topicSlug: string;
  chaptersRead: number;
  streakDays: number;
  totalChapters: number;
  // Só o próximo capítulo (chaptersRead + 1) pode ficar bloqueado — os já
  // lidos continuam sempre revisitáveis, os mais à frente nem aparecem
  // como opção ainda.
  nextChapterAvailable: boolean;
};

export type WisdomTopicSummary = {
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
// dispatchDueWisdomReminders em lib/reminders/dispatchCore.ts).
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
  topicSlug: string,
  totalChapters: number,
  row: { chaptersRead: number; streakDays: number; lastReadDate: Date | null }
): WisdomProgressView {
  return {
    topicSlug,
    chaptersRead: row.chaptersRead,
    streakDays: row.streakDays,
    totalChapters,
    nextChapterAvailable: nextChapterAvailableNow(row.chaptersRead, row.lastReadDate, todayDate(), totalChapters),
  };
}

export async function getWisdomProgressForUser(userId: string, topicSlug: string): Promise<WisdomProgressView> {
  const topic = getWisdomTopic(topicSlug);
  if (!topic) throw new Error("Tópico não encontrado");

  const row = await prisma.wisdomProgress.findUnique({ where: { userId_topicSlug: { userId, topicSlug } } });
  return toView(topicSlug, topic.chapters.length, row ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null });
}

/** Resumo de todos os tópicos pro hub de "Pílulas de sabedoria" — um card por tópico. */
export async function getWisdomTopicsSummaryForUser(userId: string): Promise<WisdomTopicSummary[]> {
  const rows = await prisma.wisdomProgress.findMany({ where: { userId } });
  const byTopicSlug = new Map(rows.map((row) => [row.topicSlug, row]));

  return WISDOM_TOPICS.map((topic) => {
    const row = byTopicSlug.get(topic.slug);
    return {
      slug: topic.slug,
      title: topic.title,
      subtitle: topic.subtitle,
      icon: topic.icon,
      color: topic.color,
      chaptersRead: row?.chaptersRead ?? 0,
      totalChapters: topic.chapters.length,
      streakDays: row?.streakDays ?? 0,
    };
  });
}

/**
 * Marca um capítulo como concluído — só aceita o próximo da sequência
 * (chaptersRead + 1) daquele tópico, e só se ele já estiver liberado hoje.
 */
export async function completeChapterForUser(
  userId: string,
  topicSlug: string,
  chapterNumber: number
): Promise<WisdomProgressView> {
  const topic = getWisdomTopic(topicSlug);
  if (!topic) throw new Error("Tópico não encontrado");

  const existing = await prisma.wisdomProgress.findUnique({ where: { userId_topicSlug: { userId, topicSlug } } });
  const current = existing ?? { chaptersRead: 0, streakDays: 0, lastReadDate: null };

  if (chapterNumber !== current.chaptersRead + 1 || chapterNumber > topic.chapters.length) {
    throw new Error("Esse capítulo não está disponível agora");
  }

  const today = todayDate();
  if (!nextChapterAvailableNow(current.chaptersRead, current.lastReadDate, today, topic.chapters.length)) {
    throw new Error("Volte amanhã para o próximo capítulo");
  }

  const streakDays = computeNextStreak(current.lastReadDate, today, current.streakDays);

  const updated = await prisma.wisdomProgress.upsert({
    where: { userId_topicSlug: { userId, topicSlug } },
    create: { userId, topicSlug, chaptersRead: chapterNumber, streakDays, lastReadDate: today },
    update: { chaptersRead: chapterNumber, streakDays, lastReadDate: today },
  });

  return toView(topicSlug, topic.chapters.length, updated);
}
