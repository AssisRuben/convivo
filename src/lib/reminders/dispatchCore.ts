import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { sendPushToUser } from "@/lib/push/expoPush";
import { estimateRunOutDate, daysBetween } from "@/lib/medications/medicationCore";
import { dueTipIndexes } from "@/lib/goals/goalCore";
import { pickTipForIndex } from "@/lib/goals/goalTips";

// O disparo não roda exatamente no minuto do horário cadastrado (depende
// de com que frequência o cron externo chama essa rota) — essa tolerância
// evita perder o lembrete se o cron rodar, por exemplo, a cada 5 minutos.
const REMINDER_TOLERANCE_MINUTES = 5;

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
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
  const weekday = now.getDay();
  const nowMinutes = minutesSinceMidnight(now);

  const items = await prisma.careChecklistItem.findMany({
    where: { active: true, timeOfDay: { not: null } },
    include: { reminderDispatches: { where: { date: today } } },
  });

  let sent = 0;
  for (const item of items) {
    if (item.reminderDispatches.length > 0) continue;
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
      tracking.purchaseDate,
      tracking.totalUnits,
      tracking.unitsPerDose,
      dosesPerDay
    );
    if (daysBetween(today, runOutDate) !== 1) continue;

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
