import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { brasiliaClock } from "@/lib/reminders/dispatchCore";

export type RoutineNextOccurrence = {
  daysAhead: number; // 0 = ainda hoje
  minutesUntil: number;
};

export type RoutineItemDetail = {
  streakDays: number;
  completedToday: boolean;
  timeOfDay: string | null;
  next: RoutineNextOccurrence | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Só olha completions dos últimos ~2 anos pra computar o streak — evita
// paginar/varrer histórico sem fim pra quem usa o app há muito tempo.
const STREAK_LOOKBACK_DAYS = 730;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseTimeOfDay(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** Sem dias marcados = todo dia (mesma regra de dispatchDueRoutineReminders). */
export function isScheduledDay(daysOfWeek: number[], weekday: number): boolean {
  return daysOfWeek.length === 0 || daysOfWeek.includes(weekday);
}

/**
 * Sequência de dias seguidos com esse cuidado marcado como feito, contando
 * só os dias em que ele estava programado (dias fora de daysOfWeek não
 * contam nem quebram a sequência). Hoje tem "graça": se ainda está
 * programado pra hoje e não foi feito ainda, não quebra a sequência —
 * começa a contar de ontem, já que o dia ainda não acabou.
 */
export function computeStreakDays(
  daysOfWeek: number[],
  completedDates: Set<string>,
  today: Date
): number {
  let cursor = today;
  if (isScheduledDay(daysOfWeek, cursor.getUTCDay()) && !completedDates.has(dateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    if (!isScheduledDay(daysOfWeek, cursor.getUTCDay())) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!completedDates.has(dateKey(cursor))) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Próxima ocorrência a partir de agora. Se ainda está programado pra hoje
 * e não foi feito, é hoje mesmo (minutesUntil pode dar negativo — já
 * passou do horário e ainda não foi marcado, o que é diferente de "vai
 * liberar daqui a pouco"). Só pula pro próximo dia programado quando hoje
 * já foi feito ou não está programado. null quando não tem horário fixo.
 */
export function computeNextOccurrence(
  timeOfDay: string | null,
  daysOfWeek: number[],
  completedToday: boolean,
  nowMinutes: number,
  nowWeekday: number
): RoutineNextOccurrence | null {
  if (!timeOfDay) return null;
  const itemMinutes = parseTimeOfDay(timeOfDay);

  if (isScheduledDay(daysOfWeek, nowWeekday) && !completedToday) {
    return { daysAhead: 0, minutesUntil: itemMinutes - nowMinutes };
  }

  for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
    const weekday = (nowWeekday + daysAhead) % 7;
    if (isScheduledDay(daysOfWeek, weekday)) {
      return { daysAhead, minutesUntil: daysAhead * 24 * 60 + itemMinutes - nowMinutes };
    }
  }
  return null; // não deveria acontecer (daysOfWeek vazio cobre todo dia)
}

export async function getRoutineItemDetailForUser(
  userId: string,
  itemId: string,
  now: Date = new Date()
): Promise<RoutineItemDetail> {
  const item = await prisma.careChecklistItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) {
    throw new Error("Sem permissão pra ver esse cuidado");
  }

  const today = todayDate();
  const since = addDays(today, -STREAK_LOOKBACK_DAYS);
  const completions = await prisma.careChecklistCompletion.findMany({
    where: { itemId, date: { gte: since } },
    select: { date: true },
  });
  const completedDates = new Set(completions.map((c) => dateKey(c.date)));
  const completedToday = completedDates.has(dateKey(today));

  const { minutes: nowMinutes, weekday: nowWeekday } = brasiliaClock(now);

  return {
    streakDays: computeStreakDays(item.daysOfWeek, completedDates, today),
    completedToday,
    timeOfDay: item.timeOfDay,
    next: computeNextOccurrence(item.timeOfDay, item.daysOfWeek, completedToday, nowMinutes, nowWeekday),
  };
}
