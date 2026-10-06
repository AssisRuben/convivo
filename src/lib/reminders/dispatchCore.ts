import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { zonedParts } from "@/lib/timeZone";
import { sendPushToUser } from "@/lib/push/expoPush";
import {
  estimateRunOutDate,
  daysBetween,
  supplyCoversTreatment,
  treatmentProgress,
  medicationStart,
} from "@/lib/medications/medicationCore";
import { dueTipIndexes } from "@/lib/goals/goalCore";
import { pickTipForIndex } from "@/lib/goals/goalTips";
import { isNextChapterAvailable as isNextWisdomChapterAvailable } from "@/lib/wisdom/wisdomCore";
import { isNextChapterAvailable as isNextFaithChapterAvailable } from "@/lib/faith/faithCore";
import { getReadingChapterCount } from "@/lib/reading/readingContent";

// O disparo não roda exatamente no minuto do horário cadastrado (depende
// de com que frequência o cron externo chama essa rota) — essa tolerância
// evita perder o lembrete se o cron rodar, por exemplo, a cada 5 minutos.
const REMINDER_TOLERANCE_MINUTES = 5;

// Horários (timeOfDay) são no relógio local da pessoa, mas o servidor roda
// em UTC — getHours()/getDay() direto comparavam com a hora UTC (um
// lembrete das 13:15 disparava às 10:15). localClock usa o fuso do celular
// da requisição (lib/timeZone.ts); no cron, que não vem de um celular, cai
// no fuso de Brasília.
export function localClock(date: Date): { minutes: number; weekday: number } {
  const { hour, minute, weekday } = zonedParts(date);
  return { minutes: hour * 60 + minute, weekday };
}

function minutesSinceMidnight(date: Date): number {
  return localClock(date).minutes;
}

function parseTimeOfDay(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Lembretes de rotina (qualquer categoria, não só medicamento) cujo
 * horário bate com agora — idempotente via CareReminderDispatch
 * (@@unique([itemId, date])), então rodar de novo no mesmo dia não
 * duplica envio.
 */
export async function dispatchDueRoutineReminders(now: Date = new Date()): Promise<number> {
  const today = todayDate();
  const { minutes: nowMinutes, weekday } = localClock(now);

  const items = await prisma.careChecklistItem.findMany({
    where: { active: true, timeOfDay: { not: null } },
    include: {
      reminderDispatches: { where: { date: today } },
      completions: { where: { date: today } },
      medicationTracking: { select: { purchaseDate: true, startDate: true, treatmentDays: true } },
    },
  });

  let sent = 0;
  for (const item of items) {
    if (item.reminderDispatches.length > 0) continue;
    // Tratamento com prazo (ex.: antibiótico de 7 dias) que já terminou —
    // para de lembrar sozinho, sem a pessoa precisar apagar a ficha.
    const tracking = item.medicationTracking;
    if (tracking && treatmentProgress(medicationStart(tracking), tracking.treatmentDays, today)?.ended) {
      continue;
    }
    // Já marcado como feito hoje (ver toggleComplete em (tabs)/rotina.tsx)
    // — lembrete existe pra não deixar esquecer, não faz sentido avisar de
    // novo depois que a pessoa já confirmou que fez.
    if (item.completions.length > 0) continue;
    if (item.daysOfWeek.length > 0 && !item.daysOfWeek.includes(weekday)) continue;
    if (!item.timeOfDay) continue;

    const itemMinutes = parseTimeOfDay(item.timeOfDay);
    if (Math.abs(itemMinutes - nowMinutes) > REMINDER_TOLERANCE_MINUTES) continue;

    await sendPushToUser(item.userId, {
      title: "Hora de cuidar de você 💊",
      body: `${item.title} — ${item.timeOfDay}`,
      data: { screen: "rotina" },
    });
    await prisma.careReminderDispatch.create({ data: { itemId: item.id, date: today } });
    sent += 1;
  }

  return sent;
}

/**
 * Aviso de "vai acabar amanhã" pra medicamento de uso contínuo —
 * idempotente via MedicationRepurchaseAlert (@@unique([medicationTrackingId]),
 * um aviso só por ficha).
 */
export async function dispatchMedicationRepurchaseAlerts(now: Date = new Date()): Promise<number> {
  const today = todayDate();

  const trackings = await prisma.medicationTracking.findMany({
    where: { active: true, alerts: { none: {} } },
    include: { checklistItems: { where: { active: true } } },
  });

  let sent = 0;
  for (const tracking of trackings) {
    const dosesPerDay = Math.max(tracking.checklistItems.length, 1);
    const runOutDate = estimateRunOutDate(
      medicationStart(tracking),
      tracking.totalUnits,
      tracking.unitsPerDose,
      dosesPerDay
    );
    if (daysBetween(today, runOutDate) !== 1) continue;
    // tratamento com prazo que termina junto com o remédio: nada a recomprar
    if (supplyCoversTreatment(medicationStart(tracking), tracking.treatmentDays, today, 1)) continue;

    await sendPushToUser(tracking.userId, {
      title: "Seu remédio está acabando 🔔",
      body: `${tracking.productName} acaba amanhã. Toque pra recomprar com 1 clique.`,
      data: { screen: "medicamentos" },
    });
    await prisma.medicationRepurchaseAlert.create({
      data: { medicationTrackingId: tracking.id },
    });
    sent += 1;
  }

  return sent;
}

/**
 * Dicas de meta (Metas com prazo) — diferente dos lembretes acima, não é
 * "está no horário certo agora", é "todas as dicas que já deveriam ter
 * sido enviadas até agora" (dueTipIndexes em lib/goals/goalCore.ts), pra
 * nunca perder uma dica se o cron ficar um tempo sem rodar — manda as
 * atrasadas de uma vez em vez de pular pra frente. Idempotente via
 * GoalTipDispatch (@@unique([goalId, tipIndex])).
 */
export async function dispatchDueGoalTips(now: Date = new Date()): Promise<number> {
  const today = todayDate();

  const goals = await prisma.goal.findMany({
    where: { endDate: { gte: today } },
    include: {
      tipDispatches: { select: { tipIndex: true } },
      checklistItem: { select: { category: true } },
    },
  });

  let sent = 0;
  for (const goal of goals) {
    const alreadySent = new Set(goal.tipDispatches.map((d) => d.tipIndex));
    const due = dueTipIndexes(goal, now).filter((index) => !alreadySent.has(index));

    for (const index of due) {
      await sendPushToUser(goal.userId, {
        title: `Dica pra sua meta: ${goal.title}`,
        body: pickTipForIndex(goal.metric, index, goal.checklistItem?.category),
        data: { screen: "metas" },
      });
      await prisma.goalTipDispatch.create({ data: { goalId: goal.id, tipIndex: index } });
      sent += 1;
    }
  }

  return sent;
}

// Horário fixo pro lembrete das trilhas de leitura diária (Pílulas de
// sabedoria / Gotas de Fé) — diferente dos lembretes de rotina, não tem
// horário configurável por usuário, é um empurrão único pela manhã.
const DAILY_READING_REMINDER_MINUTES = 8 * 60; // 08:00

/**
 * Avisa quem já começou algum tópico (tem WisdomProgress, ou seja, já leu
 * pelo menos o capítulo 1 dele) e ainda não terminou, que o capítulo de
 * hoje está liberado. Idempotente via lastNotifiedDate — não manda de novo
 * no mesmo dia se o cron rodar mais de uma vez.
 */
export async function dispatchDueWisdomReminders(now: Date = new Date()): Promise<number> {
  if (Math.abs(minutesSinceMidnight(now) - DAILY_READING_REMINDER_MINUTES) > REMINDER_TOLERANCE_MINUTES) {
    return 0;
  }

  const today = todayDate();
  // Um lembrete por USUÁRIO, não por tópico — se qualquer tópico tiver
  // capítulo disponível hoje, avisa uma vez só (evita duplicar
  // notificação quando o usuário lê mais de um tópico em paralelo).
  const rows = await prisma.wisdomProgress.findMany({
    where: { OR: [{ lastNotifiedDate: null }, { lastNotifiedDate: { not: today } }] },
  });

  const notifiedUserIds = new Set<string>();
  let sent = 0;
  for (const row of rows) {
    if (notifiedUserIds.has(row.userId)) continue;
    // capítulos do tópico vêm do banco (ReadingBook kind WISDOM, slug = topicSlug)
    const totalChapters = await getReadingChapterCount(row.topicSlug);
    if (totalChapters === 0 || row.chaptersRead >= totalChapters) continue;
    if (!isNextWisdomChapterAvailable(row.chaptersRead, row.lastReadDate, today, totalChapters)) continue;

    await sendPushToUser(row.userId, {
      title: "Sua pílula de sabedoria chegou 💊",
      body: "O capítulo de hoje já está liberado — leva menos de 5 minutos.",
      data: { screen: "pilulas-sabedoria" },
    });
    notifiedUserIds.add(row.userId);
    await prisma.wisdomProgress.update({
      where: { userId_topicSlug: { userId: row.userId, topicSlug: row.topicSlug } },
      data: { lastNotifiedDate: today },
    });
    sent += 1;
  }

  return sent;
}

/** Mesma lógica de dispatchDueWisdomReminders, pra Gotas de Fé. */
export async function dispatchDueFaithReminders(now: Date = new Date()): Promise<number> {
  if (Math.abs(minutesSinceMidnight(now) - DAILY_READING_REMINDER_MINUTES) > REMINDER_TOLERANCE_MINUTES) {
    return 0;
  }

  const today = todayDate();
  // Um lembrete por USUÁRIO, não por livro — se qualquer livro tiver
  // capítulo disponível hoje, avisa uma vez só (evita duplicar
  // notificação quando o usuário lê mais de um livro em paralelo).
  const rows = await prisma.faithProgress.findMany({
    where: { OR: [{ lastNotifiedDate: null }, { lastNotifiedDate: { not: today } }] },
  });

  const notifiedUserIds = new Set<string>();
  let sent = 0;
  for (const row of rows) {
    if (notifiedUserIds.has(row.userId)) continue;
    const totalChapters = await getReadingChapterCount(row.bookSlug);
    if (totalChapters === 0 || row.chaptersRead >= totalChapters) continue;
    if (!isNextFaithChapterAvailable(row.chaptersRead, row.lastReadDate, today, totalChapters)) continue;

    await sendPushToUser(row.userId, {
      title: "Sua gota de fé chegou 🙏",
      body: "O capítulo de hoje já está liberado — leva menos de 5 minutos.",
      data: { screen: "gotas-de-fe" },
    });
    notifiedUserIds.add(row.userId);
    await prisma.faithProgress.update({
      where: { userId_bookSlug: { userId: row.userId, bookSlug: row.bookSlug } },
      data: { lastNotifiedDate: today },
    });
    sent += 1;
  }

  return sent;
}
