import { todayDate } from "@/lib/timeline/format";
import type { Prisma } from "@/lib/generated/prisma/client";

export function sameDays(a: number[], b: number[]): boolean {
  const x = [...a].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((d, i) => d === y[i]);
}

/**
 * Histórico da agenda pra meta de Rotina não recalcular o passado com os
 * dias novos (ver CareScheduleVersion). Primeira mudança grava também a
 * agenda original, valendo desde a criação do item. Chamar dentro da
 * transação que troca os dias.
 */
export async function recordScheduleChange(
  tx: Prisma.TransactionClient,
  item: { id: string; createdAt: Date; daysOfWeek: number[] },
  newDays: number[]
): Promise<void> {
  const today = todayDate();
  const hasHistory = (await tx.careScheduleVersion.count({ where: { itemId: item.id } })) > 0;
  if (!hasHistory) {
    const createdDay = new Date(
      Date.UTC(item.createdAt.getUTCFullYear(), item.createdAt.getUTCMonth(), item.createdAt.getUTCDate())
    );
    if (createdDay.getTime() < today.getTime()) {
      await tx.careScheduleVersion.create({
        data: { itemId: item.id, daysOfWeek: item.daysOfWeek, effectiveFrom: createdDay },
      });
    }
  }
  await tx.careScheduleVersion.upsert({
    where: { itemId_effectiveFrom: { itemId: item.id, effectiveFrom: today } },
    create: { itemId: item.id, daysOfWeek: newDays, effectiveFrom: today },
    update: { daysOfWeek: newDays },
  });
}
