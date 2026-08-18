import { prisma } from "@/lib/prisma";
import { checkPressureAchievement, checkWeightAchievement } from "@/lib/timeline/achievements";
import type { HealthMeasurement, HealthMeasurementType } from "@/lib/generated/prisma/client";

export type HealthMeasurementValues = {
  type: HealthMeasurementType;
  pressaoSistolica?: number | null;
  pressaoDiastolica?: number | null;
  pesoKg?: number | null;
  percentualGordura?: number | null;
  glicemiaMgDl?: number | null;
  local: string;
  measuredAt: Date;
};

async function checkAchievementsForTypes(userId: string, types: HealthMeasurementType[]) {
  if (types.includes("PESO")) await checkWeightAchievement(userId);
  if (types.includes("PRESSAO")) await checkPressureAchievement(userId);
}

export async function listMeasurementsForUser(userId: string): Promise<HealthMeasurement[]> {
  return prisma.healthMeasurement.findMany({
    where: { userId },
    orderBy: { measuredAt: "desc" },
  });
}

/**
 * Cria vários registros de uma vez — a tela de "novo registro" mostra os 4
 * campos ao mesmo tempo em vez de pedir pra escolher um tipo por vez.
 */
export async function addMeasurementsForUser(
  userId: string,
  entries: HealthMeasurementValues[]
): Promise<void> {
  await prisma.healthMeasurement.createMany({
    data: entries.map((values) => ({ userId, ...values })),
  });
  await checkAchievementsForTypes(
    userId,
    entries.map((e) => e.type)
  );
}

export async function updateMeasurementForUser(
  userId: string,
  id: string,
  values: Omit<HealthMeasurementValues, "type">
): Promise<void> {
  const existing = await prisma.healthMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Sem permissão pra editar esse registro");
  }

  await prisma.healthMeasurement.update({ where: { id }, data: values });
}

export async function deleteMeasurementForUser(userId: string, id: string): Promise<void> {
  const existing = await prisma.healthMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Sem permissão pra remover esse registro");
  }

  await prisma.healthMeasurement.delete({ where: { id } });
}
