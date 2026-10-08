import { prisma } from "@/lib/prisma";
import { localWeekStart } from "@/lib/timeZone";
import { awardCarePoints } from "@/lib/points/pointsCore";

/**
 * Desafios da semana (segunda a domingo, relógio do celular). O progresso
 * sai dos próprios lançamentos de pontos da semana — uma consulta só, e
 * cada hábito já está ali com chave única (dose do dia, medição do dia,
 * capítulo). Completou: +CHALLENGE_POINTS, uma vez por desafio por semana
 * (refKey "desafio:<segunda>:<id>").
 */
export const CHALLENGE_POINTS = 30;

export type ChallengeId = "cuidado5" | "medicao3" | "leitura4";

export type WeeklyChallenge = {
  id: ChallengeId;
  title: string;
  progress: number;
  target: number;
  points: number;
  completed: boolean;
};

const DEFINITIONS: { id: ChallengeId; title: string; target: number }[] = [
  { id: "cuidado5", title: "Cuide de você em 5 dias da semana", target: 5 },
  { id: "medicao3", title: "Registre uma medição em 3 dias", target: 3 },
  { id: "leitura4", title: "Leia 4 capítulos de Pílulas ou Gotas", target: 4 },
];

/**
 * Progresso a partir dos lançamentos da semana. Pura.
 * - cuidado: dias distintos com dose/cuidado marcado (o dia está no fim da
 *   refKey "check:<item>:<YYYY-MM-DD>")
 * - medição: uma por dia já na origem (refKey "saude:<dia>")
 * - leitura: um lançamento por capítulo
 */
export function computeChallenges(entries: { reason: string; refKey: string }[]): Omit<WeeklyChallenge, "points" | "completed">[] {
  const careDays = new Set(
    entries.filter((e) => e.reason === "DOSE" || e.reason === "ROTINA").map((e) => e.refKey.slice(-10))
  );
  const measures = entries.filter((e) => e.reason === "MEDICAO").length;
  const readings = entries.filter((e) => e.reason === "LEITURA").length;
  const progressById: Record<ChallengeId, number> = {
    cuidado5: careDays.size,
    medicao3: measures,
    leitura4: readings,
  };
  return DEFINITIONS.map((d) => ({ id: d.id, title: d.title, target: d.target, progress: Math.min(progressById[d.id], d.target) }));
}

export async function getWeeklyChallenges(userId: string): Promise<WeeklyChallenge[]> {
  const week = localWeekStart();
  const entries = await prisma.carePointsEntry.findMany({
    where: { userId, createdAt: { gte: week.start }, reason: { in: ["DOSE", "ROTINA", "MEDICAO", "LEITURA"] } },
    select: { reason: true, refKey: true },
  });

  const challenges = computeChallenges(entries).map((c) => ({
    ...c,
    points: CHALLENGE_POINTS,
    completed: c.progress >= c.target,
  }));

  // Prêmio na hora em que alguém olha os desafios (Home): idempotente pela
  // refKey, então abrir o app de novo não paga duas vezes.
  await Promise.all(
    challenges
      .filter((c) => c.completed)
      .map((c) => awardCarePoints(userId, "DESAFIO", `desafio:${week.key}:${c.id}`, CHALLENGE_POINTS))
  );

  return challenges;
}
