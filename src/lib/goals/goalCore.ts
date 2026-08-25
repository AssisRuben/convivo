import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { daysBetween } from "@/lib/medications/medicationCore";
import { validateRoutineInput } from "@/lib/care/checklistCore";
import { pickTipForIndex } from "@/lib/goals/goalTips";
import type { CareCategory, Goal, GoalMetric } from "@/lib/generated/prisma/client";

/**
 * Metas com prazo declaradas pelo usuário — sistema separado das escadas
 * automáticas em lib/timeline/achievements.ts (GoalType/GOAL_LADDERS), que
 * não têm prazo e olham o histórico inteiro. Os dois convivem sem se
 * tocar: nada aqui lê nem escreve TimelineEvent.
 */

export type GoalStatus = "ACTIVE" | "COMPLETED" | "EXPIRED";

export type GoalInput = {
  metric: GoalMetric;
  title: string;
  targetValue?: number | null;
  startDate: Date;
  endDate: Date;
  // Só usado quando metric === "ROTINA" — cria o CareChecklistItem por
  // baixo da meta.
  routine?: { category: CareCategory; timeOfDay?: string | null; daysOfWeek: number[] };
};

export type GoalProgressView = {
  id: string;
  metric: GoalMetric;
  title: string;
  targetValue: number | null;
  baselineValue: number | null;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  progressRatio: number | null;
  progressLabel: string;
  daysElapsed: number;
  daysTotal: number;
  tipsSentCount: number;
};

export type GoalTipView = { index: number; sentAt: string; text: string };

type GoalWithItem = Goal & {
  checklistItem: { active: boolean; daysOfWeek: number[]; category: CareCategory } | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countExpectedDays(start: Date, end: Date, daysOfWeek: number[]): number {
  let count = 0;
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    if (daysOfWeek.length === 0 || daysOfWeek.includes(cursor.getUTCDay())) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export async function createGoalForUser(userId: string, input: GoalInput): Promise<Goal> {
  const title = input.title.trim();
  if (!title) throw new Error("Descreva a meta");
  if (!(input.endDate.getTime() > input.startDate.getTime())) {
    throw new Error("O prazo precisa ser depois da data de início");
  }

  if (input.metric === "PESO") {
    if (!input.targetValue || input.targetValue <= 0) {
      throw new Error("Informe quantos kg você quer perder");
    }
    const latestWeight = await prisma.healthMeasurement.findFirst({
      where: { userId, type: "PESO", pesoKg: { not: null } },
      orderBy: { measuredAt: "desc" },
    });
    return prisma.goal.create({
      data: {
        userId,
        metric: "PESO",
        title,
        targetValue: input.targetValue,
        baselineValue: latestWeight?.pesoKg ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
      },
    });
  }

  if (input.metric === "ROTINA") {
    if (!input.routine) throw new Error("Configure os dias e horário da rotina");
    const routineTitle = validateRoutineInput({ ...input.routine, title });

    return prisma.$transaction(async (tx) => {
      const item = await tx.careChecklistItem.create({
        data: {
          userId,
          title: routineTitle,
          category: input.routine!.category,
          timeOfDay: input.routine!.timeOfDay || null,
          daysOfWeek: input.routine!.daysOfWeek,
        },
      });
      return tx.goal.create({
        data: {
          userId,
          metric: "ROTINA",
          title,
          startDate: input.startDate,
          endDate: input.endDate,
          checklistItemId: item.id,
        },
      });
    });
  }

  // PRESSAO — sem alvo numérico no v1 (o exemplo do usuário não trouxe um
  // número); progresso mostra só a última leitura, ver computeGoalProgress.
  return prisma.goal.create({
    data: {
      userId,
      metric: "PRESSAO",
      title,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

function deriveStatus(goal: Goal, progressRatio: number | null, today: Date): GoalStatus {
  if (progressRatio != null && progressRatio >= 1) return "COMPLETED";
  if (today.getTime() > goal.endDate.getTime()) return "EXPIRED";
  return "ACTIVE";
}

async function computeGoalProgress(goal: GoalWithItem): Promise<GoalProgressView> {
  const today = todayDate();
  const daysTotal = daysBetween(goal.startDate, goal.endDate);
  const daysElapsed = clamp(daysBetween(goal.startDate, today), 0, daysTotal);

  let progressRatio: number | null = null;
  let progressLabel = "";
  let status: GoalStatus | null = null;

  if (goal.metric === "PESO") {
    const latest = await prisma.healthMeasurement.findFirst({
      where: {
        userId: goal.userId,
        type: "PESO",
        pesoKg: { not: null },
        measuredAt: { gte: goal.startDate },
      },
      orderBy: { measuredAt: "desc" },
    });
    if (goal.baselineValue == null || !latest?.pesoKg) {
      progressLabel = "Aguardando a primeira pesagem desde que a meta começou";
    } else {
      const lost = goal.baselineValue - latest.pesoKg;
      progressRatio = goal.targetValue ? clamp(lost / goal.targetValue, 0, 1) : null;
      progressLabel = `${lost.toFixed(1)}kg de ${goal.targetValue}kg`;
    }
  } else if (goal.metric === "ROTINA") {
    if (goal.checklistItem && !goal.checklistItem.active) {
      // Item removido da rotina independentemente da meta (soft-delete via
      // active:false) — a meta não consegue mais acumular progresso.
      progressLabel = "O cuidado vinculado foi removido da sua rotina";
      status = "EXPIRED";
    } else if (goal.checklistItemId) {
      const rangeEnd = today.getTime() < goal.endDate.getTime() ? today : goal.endDate;
      const expectedDays = countExpectedDays(
        goal.startDate,
        rangeEnd,
        goal.checklistItem?.daysOfWeek ?? []
      );
      const completions = await prisma.careChecklistCompletion.count({
        where: { itemId: goal.checklistItemId, date: { gte: goal.startDate, lte: rangeEnd } },
      });
      progressRatio = expectedDays > 0 ? clamp(completions / expectedDays, 0, 1) : null;
      progressLabel = `${completions} de ${expectedDays} dias`;
    }
  } else {
    // PRESSAO
    const latest = await prisma.healthMeasurement.findFirst({
      where: { userId: goal.userId, type: "PRESSAO", measuredAt: { gte: goal.startDate } },
      orderBy: { measuredAt: "desc" },
    });
    progressLabel =
      latest?.pressaoSistolica != null && latest.pressaoDiastolica != null
        ? `Última leitura: ${latest.pressaoSistolica}/${latest.pressaoDiastolica}`
        : "Nenhuma leitura registrada desde que a meta começou";
  }

  const tipsSentCount = await prisma.goalTipDispatch.count({ where: { goalId: goal.id } });

  return {
    id: goal.id,
    metric: goal.metric,
    title: goal.title,
    targetValue: goal.targetValue,
    baselineValue: goal.baselineValue,
    startDate: toDateOnlyString(goal.startDate),
    endDate: toDateOnlyString(goal.endDate),
    status: status ?? deriveStatus(goal, progressRatio, today),
    progressRatio,
    progressLabel,
    daysElapsed,
    daysTotal,
    tipsSentCount,
  };
}

async function requireOwnedGoal(userId: string, id: string): Promise<GoalWithItem> {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { checklistItem: { select: { active: true, daysOfWeek: true, category: true } } },
  });
  if (!goal || goal.userId !== userId) {
    throw new Error("Sem permissão pra acessar essa meta");
  }
  return goal;
}

export async function listGoalsForUser(userId: string): Promise<GoalProgressView[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { checklistItem: { select: { active: true, daysOfWeek: true, category: true } } },
  });
  return Promise.all(goals.map(computeGoalProgress));
}

export async function getGoalDetailForUser(
  userId: string,
  id: string
): Promise<GoalProgressView & { tips: GoalTipView[] }> {
  const goal = await requireOwnedGoal(userId, id);
  const progress = await computeGoalProgress(goal);

  const dispatches = await prisma.goalTipDispatch.findMany({
    where: { goalId: id },
    orderBy: { sentAt: "desc" },
  });
  const tips = dispatches.map((d) => ({
    index: d.tipIndex,
    sentAt: d.sentAt.toISOString(),
    text: pickTipForIndex(goal.metric, d.tipIndex, goal.checklistItem?.category),
  }));

  return { ...progress, tips };
}

/**
 * Não apaga o CareChecklistItem vinculado (meta de rotina) — cancelar a
 * meta não deveria também apagar o hábito em si, caso o usuário queira
 * continuar fazendo mesmo sem o acompanhamento de prazo/dicas.
 */
export async function deleteGoalForUser(userId: string, id: string): Promise<void> {
  await requireOwnedGoal(userId, id);
  await prisma.goal.delete({ where: { id } });
}

// Intervalo fixo entre dicas — diferente de "sempre 12 dicas no total",
// aqui a quantidade de dicas cresce com o prazo da meta (uma meta de 4
// meses recebe bem mais que 12). O conteúdo em goalTips.ts não precisa
// crescer junto: pickTipForIndex já cicla pela lista curada quando o
// índice passa do tamanho dela.
export const TIP_INTERVAL_DAYS = 5;

/**
 * Índices (0-based) de dicas já devidas pra essa meta agora — não só a
 * próxima da fila, todas as que já deveriam ter sido enviadas. Assim, se o
 * cron ficar um tempo sem rodar, o usuário recebe as atrasadas de uma vez
 * em vez de perder pra sempre. Naturalmente limitado ao intervalo
 * [startDate, endDate] da meta — o índice não passa do último "degrau" de
 * 5 dias que cabe dentro do prazo.
 */
export function dueTipIndexes(goal: { startDate: Date; endDate: Date }, now: Date): number[] {
  const totalDays = daysBetween(goal.startDate, goal.endDate);
  if (totalDays <= 0) return [];

  const elapsedDays = daysBetween(goal.startDate, now);
  if (elapsedDays < 0) return [];

  const maxIndex = Math.floor(totalDays / TIP_INTERVAL_DAYS);
  const dueCount = Math.min(maxIndex + 1, Math.floor(elapsedDays / TIP_INTERVAL_DAYS) + 1);
  return Array.from({ length: Math.max(dueCount, 0) }, (_, i) => i);
}
