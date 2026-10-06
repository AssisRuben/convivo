import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";
import { zonedParts } from "@/lib/timeZone";

/**
 * Pontos de cuidado: hábito de saúde vira ponto, e a cada
 * POINTS_PER_REWARD pontos a pessoa ganha REWARD_CENTS de crédito na
 * carteira — no máximo MONTHLY_CAP_CENTS por mês (decisão de negócio,
 * 06/10/2026). Separado dos selos de compra do cartão fidelidade.
 */
export const CARE_POINTS = {
  DOSE: 2, // dose de remédio marcada
  ROTINA: 1, // outro cuidado da Rotina marcado
  MEDICAO: 5, // medição de saúde (uma por dia)
  LEITURA: 3, // capítulo de Pílulas/Gotas lido
} as const;

export const POINTS_PER_REWARD = 500;
export const REWARD_CENTS = 500; // R$ 5
export const MONTHLY_CAP_CENTS = 1000; // R$ 10
// Pontos da Rotina (doses + cuidados) por dia — sem teto, criar 50
// cuidados falsos viraria crédito de verdade.
export const DAILY_ROUTINE_POINTS_CAP = 20;

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

/** Instante da meia-noite de hoje no relógio do celular (lib/timeZone). */
function startOfLocalDay(now: Date = new Date()): Date {
  const { hour, minute } = zonedParts(now);
  const elapsedMs = ((hour * 60 + minute) * 60 + now.getUTCSeconds()) * 1000 + now.getUTCMilliseconds();
  return new Date(now.getTime() - elapsedMs);
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

/**
 * Registra um ganho (idempotente pela refKey) e converte se passou dos
 * 500. Nunca lança — ponto é bônus, não pode quebrar marcar dose,
 * registrar medição ou ler capítulo.
 */
export async function awardCarePoints(
  userId: string,
  reason: keyof typeof CARE_POINTS | "DESAFIO",
  refKey: string,
  points: number
): Promise<void> {
  try {
    let amount = points;
    if (reason === "DOSE" || reason === "ROTINA") {
      const already = await prisma.carePointsEntry.aggregate({
        where: { userId, reason: { in: ["DOSE", "ROTINA"] }, createdAt: { gte: startOfLocalDay() } },
        _sum: { points: true },
      });
      amount = routinePointsAllowed(points, already._sum.points ?? 0);
      if (amount <= 0) return;
    }

    await prisma.carePointsEntry.create({ data: { userId, points: amount, reason, refKey } });
    await convertIfPossible(userId);
  } catch (error) {
    // P2002 (refKey repetida) = já ganhou por isso; o resto vai pro log
    if ((error as { code?: string })?.code !== "P2002") {
      console.error("[pontos] não foi possível registrar:", error);
    }
  }
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
  const [balance, monthRewardCents, todayAgg] = await Promise.all([
    balanceOf(userId),
    monthRewardCentsOf(userId, today),
    prisma.carePointsEntry.aggregate({
      where: { userId, points: { gt: 0 }, reason: { not: "CONVERSAO" }, createdAt: { gte: startOfLocalDay() } },
      _sum: { points: true },
    }),
  ]);
  return {
    balance: Math.max(balance, 0),
    pointsPerReward: POINTS_PER_REWARD,
    rewardCents: REWARD_CENTS,
    monthRewardCents,
    monthCapCents: MONTHLY_CAP_CENTS,
    todayPoints: todayAgg._sum.points ?? 0,
  };
}

/** refKeys padronizadas — sempre com o dia local quando o ganho é diário. */
export const pointsKey = {
  check: (itemId: string, today: Date = todayDate()) => `check:${itemId}:${dayKey(today)}`,
  medicao: (today: Date = todayDate()) => `saude:${dayKey(today)}`,
  leitura: (kind: "wisdom" | "faith", slug: string, chapter: number) => `${kind}:${slug}:${chapter}`,
};
