import { prisma } from "@/lib/prisma";
import {
  checkCareCompletionAchievement,
  checkRoutineStreakMilestones,
} from "@/lib/timeline/achievements";
import { todayDate } from "@/lib/timeline/format";
import type { CareCategory } from "@/lib/generated/prisma/client";

/**
 * Lógica de rotina/checklist compartilhada entre as server actions da web
 * (`lib/actions/careChecklist.ts`) e as rotas mobile
 * (`app/api/mobile/rotina/**`) — mesmo padrão do `feedCore.ts`.
 */

export type RoutineItemInput = {
  title: string;
  category: CareCategory;
  timeOfDay?: string | null;
  daysOfWeek: number[];
};

export type ChecklistItemView = {
  id: string;
  title: string;
  category: CareCategory;
  timeOfDay: string | null;
  daysOfWeek: number[];
  completedToday: boolean;
  // Vínculos que o usuário precisa enxergar na Rotina antes de editar ou
  // apagar o item — ele pode ser a dose de um remédio (ficha em
  // Medicamentos) ou o hábito medido por uma meta em andamento.
  medicationTrackingId: string | null;
  activeGoals: { id: string; title: string }[];
};

export function validateRoutineInput(input: RoutineItemInput): string {
  const title = input.title.trim();
  if (!title) throw new Error("Descreva o cuidado");
  if (input.timeOfDay && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.timeOfDay)) {
    throw new Error("Horário inválido");
  }
  if (input.daysOfWeek.some((d) => d < 0 || d > 6)) {
    throw new Error("Dia da semana inválido");
  }
  return title;
}

// Bem acima do maior degrau de conquista (GOAL_LADDERS.ROTINA, até 120) —
// sem custo de rodar em toda carga da aba, é uma query só (ver abaixo),
// não N round-trips por dia como currentRoutineStreak em achievements.ts.
const OVERALL_STREAK_LOOKBACK_DAYS = 400;

/** Parte pura de getOverallRoutineStreak — testável sem Prisma. */
export function computeOverallStreakFromDates(doneDateKeys: Set<string>, today: Date): number {
  let streak = 0;
  let cursor = today;
  for (let i = 0; i < OVERALL_STREAK_LOOKBACK_DAYS; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (!doneDateKeys.has(key)) break;
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

/**
 * "Dias seguidos cuidando de você" — diferente do degrau de conquista
 * (currentRoutineStreak em timeline/achievements.ts, que exige TODOS os
 * cuidados ativos feitos no dia, um marco raro de 30+ dias), esse é o
 * streak "amigável" mostrado no topo da aba: basta ter marcado QUALQUER
 * cuidado naquele dia. Sobe assim que a pessoa marca o primeiro item do
 * dia — é o que dispara a comemoração no cliente.
 */
export async function getOverallRoutineStreak(userId: string): Promise<number> {
  const activeItems = await prisma.careChecklistItem.findMany({
    where: { userId, active: true },
    select: { id: true },
  });
  if (activeItems.length === 0) return 0;
  const activeIds = activeItems.map((i) => i.id);

  const today = todayDate();
  const since = new Date(today.getTime() - OVERALL_STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const completions = await prisma.careChecklistCompletion.findMany({
    where: { itemId: { in: activeIds }, date: { gte: since } },
    select: { date: true },
  });

  const doneDates = new Set(completions.map((c) => c.date.toISOString().slice(0, 10)));
  return computeOverallStreakFromDates(doneDates, today);
}

export async function listChecklistItemsForUser(userId: string): Promise<ChecklistItemView[]> {
  // Uma query só (join via `include`) em vez de duas idas ao banco em
  // sequência — cada round-trip custa caro contra o pooler remoto da
  // Supabase, e essa rota já soma outro round-trip só pra autenticar
  // (ver getApiUserId), então eliminar um daqui é sensível no tempo de
  // resposta percebido ao abrir a aba.
  const today = todayDate();
  const items = await prisma.careChecklistItem.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
    include: {
      completions: { where: { date: today }, select: { id: true } },
      goals: { where: { endDate: { gte: today } }, select: { id: true, title: true } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    timeOfDay: item.timeOfDay,
    daysOfWeek: item.daysOfWeek,
    completedToday: item.completions.length > 0,
    medicationTrackingId: item.medicationTrackingId,
    activeGoals: item.goals,
  }));
}

export async function createChecklistItemForUser(
  userId: string,
  input: RoutineItemInput
): Promise<void> {
  const title = validateRoutineInput(input);
  await prisma.careChecklistItem.create({
    data: {
      userId,
      title,
      category: input.category,
      timeOfDay: input.timeOfDay || null,
      daysOfWeek: input.daysOfWeek,
    },
  });
}

async function requireOwnedItem(userId: string, id: string) {
  const item = await prisma.careChecklistItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    throw new Error("Sem permissão pra alterar esse cuidado");
  }
  return item;
}

export async function updateChecklistItemForUser(
  userId: string,
  id: string,
  input: RoutineItemInput
): Promise<void> {
  const title = validateRoutineInput(input);
  const existing = await requireOwnedItem(userId, id);
  const newTime = input.timeOfDay || null;

  await prisma.careChecklistItem.update({
    where: { id },
    data: {
      title,
      category: input.category,
      timeOfDay: newTime,
      daysOfWeek: input.daysOfWeek,
    },
  });

  // O disparo é idempotente por (item, dia) — sem isso, um lembrete que já
  // saiu hoje no horário antigo impedia o novo horário de avisar de novo.
  if (newTime !== existing.timeOfDay) {
    await prisma.careReminderDispatch.deleteMany({ where: { itemId: id, date: todayDate() } });
  }
}

export async function deactivateChecklistItemForUser(userId: string, id: string): Promise<void> {
  await requireOwnedItem(userId, id);
  await prisma.careChecklistItem.update({ where: { id }, data: { active: false } });
}

export async function completeChecklistItemForUser(userId: string, itemId: string): Promise<void> {
  await requireOwnedItem(userId, itemId);
  const date = todayDate();

  await prisma.careChecklistCompletion.upsert({
    where: { itemId_date: { itemId, date } },
    update: {},
    create: { itemId, date },
  });

  await checkCareCompletionAchievement(userId, date);
  await checkRoutineStreakMilestones(userId, date);
}

export async function uncompleteChecklistItemForUser(userId: string, itemId: string): Promise<void> {
  await requireOwnedItem(userId, itemId);
  const date = todayDate();

  await prisma.careChecklistCompletion
    .delete({ where: { itemId_date: { itemId, date } } })
    .catch(() => {
      // não havia conclusão hoje pra remover — ok, é idempotente
    });
}
