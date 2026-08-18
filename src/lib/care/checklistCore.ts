import { prisma } from "@/lib/prisma";
import { checkCareCompletionAchievement } from "@/lib/timeline/achievements";
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

export async function listChecklistItemsForUser(userId: string): Promise<ChecklistItemView[]> {
  const items = await prisma.careChecklistItem.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
  });
  if (items.length === 0) return [];

  const completions = await prisma.careChecklistCompletion.findMany({
    where: { itemId: { in: items.map((i) => i.id) }, date: todayDate() },
    select: { itemId: true },
  });
  const completedIds = new Set(completions.map((c) => c.itemId));

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    timeOfDay: item.timeOfDay,
    daysOfWeek: item.daysOfWeek,
    completedToday: completedIds.has(item.id),
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
  await requireOwnedItem(userId, id);

  await prisma.careChecklistItem.update({
    where: { id },
    data: {
      title,
      category: input.category,
      timeOfDay: input.timeOfDay || null,
      daysOfWeek: input.daysOfWeek,
    },
  });
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
