import { prisma } from "@/lib/prisma";

export const LOYALTY_STAMP_CARD_SIZE = 10;
export const LOYALTY_MIN_ORDER_CENTS = 5000;
export const LOYALTY_REWARD_CENTS = 5000;

export type LoyaltyProgress = {
  stampsFilled: number;
  stampsTotal: number;
  completedCycles: number;
  totalRewardCents: number;
  minOrderCents: number;
  rewardPerCycleCents: number;
};

async function countQualifyingOrders(userId: string): Promise<number> {
  return prisma.order.count({
    where: { userId, status: "APPROVED", totalCents: { gte: LOYALTY_MIN_ORDER_CENTS } },
  });
}

export async function getLoyaltyProgress(userId: string): Promise<LoyaltyProgress> {
  const [qualifyingOrders, cycles] = await Promise.all([
    countQualifyingOrders(userId),
    prisma.loyaltyStampCycle.aggregate({
      where: { userId },
      _sum: { rewardCents: true },
      _count: true,
    }),
  ]);

  return {
    stampsFilled: qualifyingOrders % LOYALTY_STAMP_CARD_SIZE,
    stampsTotal: LOYALTY_STAMP_CARD_SIZE,
    completedCycles: cycles._count,
    totalRewardCents: cycles._sum.rewardCents ?? 0,
    minOrderCents: LOYALTY_MIN_ORDER_CENTS,
    rewardPerCycleCents: LOYALTY_REWARD_CENTS,
  };
}

/**
 * Chamada depois que um pedido é aprovado — se o total de pedidos
 * qualificados (>= LOYALTY_MIN_ORDER_CENTS) do usuário acabou de completar
 * um novo ciclo de 10 selos, credita o prêmio na carteira. Idempotente via
 * unique(userId, cycleNumber): se approveOrder rodar de novo pro mesmo
 * pedido (retry de webhook), o ciclo já existe e o create falha em
 * silêncio (P2002), sem creditar duas vezes.
 */
export async function checkLoyaltyStampReward(userId: string): Promise<void> {
  const qualifyingOrders = await countQualifyingOrders(userId);
  if (qualifyingOrders === 0 || qualifyingOrders % LOYALTY_STAMP_CARD_SIZE !== 0) return;

  const cycleNumber = qualifyingOrders / LOYALTY_STAMP_CARD_SIZE;

  try {
    await prisma.$transaction([
      prisma.loyaltyStampCycle.create({
        data: { userId, cycleNumber, rewardCents: LOYALTY_REWARD_CENTS },
      }),
      prisma.walletEntry.create({
        data: {
          userId,
          amountCents: LOYALTY_REWARD_CENTS,
          source: "LOYALTY_STAMP_REWARD",
          description: `Cartão fidelidade completo (ciclo ${cycleNumber}) — 10 compras`,
        },
      }),
    ]);
  } catch (error) {
    const isDuplicateCycle =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002";
    if (!isDuplicateCycle) throw error;
  }
}
