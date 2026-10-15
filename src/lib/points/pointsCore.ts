import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { localWeekStart, startOfLocalDay } from "@/lib/timeZone";

/**
 * Pontos de cuidado: hábito de saúde vira ponto, e a cada
 * POINTS_PER_REWARD pontos a pessoa ganha REWARD_CENTS de crédito na
 * carteira — no máximo MONTHLY_CAP_CENTS por mês (decisão de negócio,
 * 06/10/2026). Separado dos selos de compra do cartão fidelidade.
 */
export const CARE_POINTS = {
  DOSE: 2, // dose de remédio marcada
  ROTINA: 1, // outro cuidado da Rotina marcado
  MEDICAO: 5, // medição de saúde (um dia conta uma vez; até 3 dias por semana)
  LEITURA: 3, // capítulo de Pílulas/Gotas lido (um por dia, somando as trilhas)
} as const;

export const POINTS_PER_REWARD = 500;
export const REWARD_CENTS = 500; // R$ 5
export const MONTHLY_CAP_CENTS = 1000; // R$ 10
// Pontos da Rotina (doses + cuidados) por dia — sem teto, criar 50
// cuidados falsos viraria crédito de verdade.
export const DAILY_ROUTINE_POINTS_CAP = 10;
// Medição dá ponto em até 3 dias da semana: o ponto é pra criar o hábito,
// não pra estimular medir todo dia sem indicação (ex.: glicemia, que gasta
// fita e fura o dedo).
export const WEEKLY_MEASUREMENT_DAYS = 3;
// Leitura: um capítulo por dia vale ponto, não um por trilha — com várias
// trilhas, ler todas no mesmo dia virava pontos demais.
export const DAILY_READING_POINTS = 1;

export type CarePointsSummary = {
  /** Pontos acumulados ainda não convertidos (rumo ao próximo crédito). */
  balance: number;
  pointsPerReward: number;
  rewardCents: number;
  /** Crédito já ganho com pontos neste mês / teto do mês. */
  monthRewardCents: number;
  monthCapCents: number;
  /** Pontos ganhos hoje. */
  todayPoints: number;
  /** Pontos só viram crédito com o CPF confirmado (uma pessoa real =
   * uma conta; sem isso, várias contas multiplicavam o teto do mês). */
  canRedeem: boolean;
  /** Quanto dos limites já foi usado — o app calcula na hora os pontos de
   * uma ação com as mesmas regras daqui (ver lib/carePointsLocal.ts). */
  routinePointsToday: number;
  caredToday: boolean;
  measuredToday: boolean;
  measurementDaysThisWeek: number;
  readingPaidToday: boolean;
};

function monthKey(today: Date): string {
  return today.toISOString().slice(0, 7); // "2026-10"
}

function dayKey(today: Date): string {
  return today.toISOString().slice(0, 10);
}

/**
 * Quantas conversões cabem agora: pelo saldo de pontos e pelo que ainda
 * falta do teto do mês. Pura — testável sem banco.
 */
export function conversionsAvailable(balance: number, monthRewardCents: number): number {
  const byBalance = Math.floor(Math.max(balance, 0) / POINTS_PER_REWARD);
  const byCap = Math.floor(Math.max(MONTHLY_CAP_CENTS - monthRewardCents, 0) / REWARD_CENTS);
  return Math.min(byBalance, byCap);
}

/** Quanto ainda dá pra ganhar hoje na Rotina, dado o já ganho. Pura. */
export function routinePointsAllowed(wanted: number, alreadyToday: number): number {
  return Math.max(Math.min(wanted, DAILY_ROUTINE_POINTS_CAP - alreadyToday), 0);
}

async function balanceOf(userId: string): Promise<number> {
  const result = await prisma.carePointsEntry.aggregate({ where: { userId }, _sum: { points: true } });
  return result._sum.points ?? 0;
}

async function monthRewardCentsOf(userId: string, today: Date): Promise<number> {
  const conversions = await prisma.carePointsEntry.count({
    where: { userId, reason: "CONVERSAO", refKey: { startsWith: `conv:${monthKey(today)}:` } },
  });
  return conversions * REWARD_CENTS;
}

/**
 * Converte o que der em crédito na carteira. A refKey da conversão
 * ("conv:<mês>:<n>") é única: duas chamadas ao mesmo tempo não convertem
 * o mesmo saldo duas vezes — a segunda bate na chave e para.
 */
async function convertIfPossible(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { cpfVerifiedAt: true } });
  if (!user?.cpfVerifiedAt) return; // acumula; converte quando confirmar o CPF
  const today = todayDate();
  const [balance, monthRewardCents] = await Promise.all([balanceOf(userId), monthRewardCentsOf(userId, today)]);
  const count = conversionsAvailable(balance, monthRewardCents);

  for (let i = 0; i < count; i++) {
    const n = monthRewardCents / REWARD_CENTS + i + 1;
    try {
      await prisma.$transaction([
        prisma.carePointsEntry.create({
          data: {
            userId,
            points: -POINTS_PER_REWARD,
            reason: "CONVERSAO",
            refKey: `conv:${monthKey(today)}:${n}`,
          },
        }),
        prisma.walletEntry.create({
          data: {
            userId,
            amountCents: REWARD_CENTS,
            source: "CARE_POINTS",
            description: `Pontos de cuidado: ${POINTS_PER_REWARD} pontos viraram R$ ${(REWARD_CENTS / 100).toFixed(2).replace(".", ",")}`,
          },
        }),
      ]);
    } catch {
      return; // outra chamada já converteu esse lugar — sem duplicar
    }
  }
}

/** Converte o saldo guardado — chamado quando a pessoa confirma o CPF. */
export async function convertCarePoints(userId: string): Promise<void> {
  try {
    await convertIfPossible(userId);
  } catch (error) {
    console.error("[pontos] conversão:", error);
  }
}

/**
 * Quantos pontos esse ganho vale de verdade, pelos limites (teto diário da
 * Rotina, medição em até 3 dias da semana, um capítulo por dia).
 */
async function allowedPoints(
  userId: string,
  reason: keyof typeof CARE_POINTS | "DESAFIO",
  points: number
): Promise<number> {
  if (reason === "DOSE" || reason === "ROTINA") {
    const already = await prisma.carePointsEntry.aggregate({
      where: { userId, reason: { in: ["DOSE", "ROTINA"] }, createdAt: { gte: startOfLocalDay() } },
      _sum: { points: true },
    });
    return routinePointsAllowed(points, already._sum.points ?? 0);
  }
  if (reason === "MEDICAO") {
    const paidDays = await prisma.carePointsEntry.count({
      where: { userId, reason: "MEDICAO", points: { gt: 0 }, createdAt: { gte: localWeekStart().start } },
    });
    return paidDays < WEEKLY_MEASUREMENT_DAYS ? points : 0;
  }
  if (reason === "LEITURA") {
    const paidToday = await prisma.carePointsEntry.count({
      where: { userId, reason: "LEITURA", points: { gt: 0 }, createdAt: { gte: startOfLocalDay() } },
    });
    return paidToday < DAILY_READING_POINTS ? points : 0;
  }
  return points;
}

/**
 * Registra um ganho (idempotente pela refKey) e converte se passou dos
 * 500. Passou do limite: o lançamento entra com 0 ponto — o hábito
 * continua contando pros desafios da semana, só não vale ponto. Nunca
 * lança — ponto é bônus, não pode quebrar marcar dose, registrar medição
 * ou ler capítulo.
 */
export async function awardCarePoints(
  userId: string,
  reason: keyof typeof CARE_POINTS | "DESAFIO",
  refKey: string,
  points: number,
  { eligible = true }: { eligible?: boolean } = {}
): Promise<number> {
  try {
    const amount = eligible ? await allowedPoints(userId, reason, points) : 0;
    await prisma.carePointsEntry.create({ data: { userId, points: amount, reason, refKey } });
    if (amount > 0) await convertIfPossible(userId);
    return amount;
  } catch (error) {
    // P2002 (refKey repetida) = já ganhou por isso; o resto vai pro log
    if ((error as { code?: string })?.code !== "P2002") {
      console.error("[pontos] não foi possível registrar:", error);
    }
    return 0;
  }
}

/** Pontos que cada cuidado ganhou hoje (null = ainda não marcado hoje). */
export async function checkPointsToday(userId: string, itemIds: string[]): Promise<Map<string, number>> {
  if (itemIds.length === 0) return new Map();
  const today = todayDate();
  const keys = itemIds.map((id) => pointsKey.check(id, today));
  const entries = await prisma.carePointsEntry.findMany({
    where: { userId, refKey: { in: keys } },
    select: { refKey: true, points: true },
  });
  const byKey = new Map(entries.map((e) => [e.refKey, e.points]));
  return new Map(itemIds.map((id) => [id, byKey.get(pointsKey.check(id, today))]).filter(([, p]) => p !== undefined) as [string, number][]);
}

/** Desfaz um ganho (ex.: desmarcou a dose no mesmo dia). Nunca lança. */
export async function revokeCarePoints(userId: string, refKey: string): Promise<void> {
  try {
    await prisma.carePointsEntry.deleteMany({ where: { userId, refKey } });
  } catch (error) {
    console.error("[pontos] não foi possível desfazer:", error);
  }
}

export async function getCarePointsSummary(userId: string): Promise<CarePointsSummary> {
  const today = todayDate();
  const dayStart = startOfLocalDay();
  const [balance, monthRewardCents, todayAgg, user, todayEntries, weekMeasures] = await Promise.all([
    balanceOf(userId),
    monthRewardCentsOf(userId, today),
    prisma.carePointsEntry.aggregate({
      where: { userId, points: { gt: 0 }, reason: { not: "CONVERSAO" }, createdAt: { gte: startOfLocalDay() } },
      _sum: { points: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { cpfVerifiedAt: true } }),
    prisma.carePointsEntry.findMany({
      where: { userId, createdAt: { gte: dayStart }, reason: { in: ["DOSE", "ROTINA", "MEDICAO", "LEITURA"] } },
      select: { reason: true, points: true },
    }),
    prisma.carePointsEntry.count({
      where: { userId, reason: "MEDICAO", points: { gt: 0 }, createdAt: { gte: localWeekStart().start } },
    }),
  ]);
  const care = todayEntries.filter((e) => e.reason === "DOSE" || e.reason === "ROTINA");
  return {
    balance: Math.max(balance, 0),
    pointsPerReward: POINTS_PER_REWARD,
    rewardCents: REWARD_CENTS,
    monthRewardCents,
    monthCapCents: MONTHLY_CAP_CENTS,
    todayPoints: todayAgg._sum.points ?? 0,
    canRedeem: Boolean(user?.cpfVerifiedAt),
    routinePointsToday: care.reduce((sum, e) => sum + e.points, 0),
    caredToday: care.length > 0,
    measuredToday: todayEntries.some((e) => e.reason === "MEDICAO"),
    measurementDaysThisWeek: weekMeasures,
    readingPaidToday: todayEntries.some((e) => e.reason === "LEITURA" && e.points > 0),
  };
}

/** refKeys padronizadas — sempre com o dia local quando o ganho é diário. */
export const pointsKey = {
  check: (itemId: string, today: Date = todayDate()) => `check:${itemId}:${dayKey(today)}`,
  medicao: (today: Date = todayDate()) => `saude:${dayKey(today)}`,
  leitura: (kind: "wisdom" | "faith", slug: string, chapter: number) => `${kind}:${slug}:${chapter}`,
};
