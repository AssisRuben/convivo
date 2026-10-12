import { prisma } from "@/lib/prisma";
import { getStoreSalesForUser, type StoreSale } from "@/lib/pharmacyDb";
import { sendPushToUser } from "@/lib/push/expoPush";

export const LOYALTY_STAMP_CARD_SIZE = 10;
export const LOYALTY_MIN_ORDER_CENTS = 5000;
export const LOYALTY_REWARD_CENTS = 5000;

/** De quanto em quanto tempo as compras da loja viram selos de novo. */
const STORE_SYNC_MAX_AGE_MS = 6 * 60 * 60 * 1000;
/** Abrindo a tela do cartão, busca de novo se a última foi há mais que isso. */
export const STORE_SYNC_ON_VIEW_MS = 10 * 60 * 1000;
const STORE_SYNC_BATCH = 40;

export type LoyaltyProgress = {
  stampsFilled: number;
  stampsTotal: number;
  completedCycles: number;
  totalRewardCents: number;
  minOrderCents: number;
  rewardPerCycleCents: number;
};

/**
 * Aritmética pura do cartão — quantos selos preenchidos no ciclo atual, e
 * se `qualifyingOrders` acabou de bater um múltiplo de 10 (nesse caso,
 * qual o número do ciclo completado). Separada da leitura do banco pra
 * dar pra testar sem Prisma.
 */
export function computeStampCycle(qualifyingOrders: number): {
  stampsFilled: number;
  justCompletedCycle: number | null;
} {
  const stampsFilled = qualifyingOrders % LOYALTY_STAMP_CARD_SIZE;
  const justCompletedCycle =
    qualifyingOrders > 0 && stampsFilled === 0 ? qualifyingOrders / LOYALTY_STAMP_CARD_SIZE : null;
  return { stampsFilled, justCompletedCycle };
}

/**
 * Vendas da loja que valem selo: R$ 50+ e que não sejam o próprio pedido
 * do app já enviado à Trier (esse já tem o selo do lado do app — mesma
 * nota em Order.trierNumeroNota).
 */
export function qualifyingStoreSales(sales: StoreSale[], appNotas: Set<number>): StoreSale[] {
  return sales.filter(
    (sale) =>
      sale.totalCents >= LOYALTY_MIN_ORDER_CENTS && !(sale.numeroNota != null && appNotas.has(sale.numeroNota))
  );
}

/** Um selo por compra de R$ 50+, no app ou na loja (ver LoyaltyStamp). */
async function countStamps(userId: string): Promise<number> {
  return prisma.loyaltyStamp.count({ where: { userId } });
}

export async function getLoyaltyProgress(userId: string): Promise<LoyaltyProgress> {
  const [stamps, cycles] = await Promise.all([
    countStamps(userId),
    prisma.loyaltyStampCycle.aggregate({
      where: { userId },
      _sum: { rewardCents: true },
      _count: true,
    }),
  ]);

  return {
    stampsFilled: computeStampCycle(stamps).stampsFilled,
    stampsTotal: LOYALTY_STAMP_CARD_SIZE,
    completedCycles: cycles._count,
    totalRewardCents: cycles._sum.rewardCents ?? 0,
    minOrderCents: LOYALTY_MIN_ORDER_CENTS,
    rewardPerCycleCents: LOYALTY_REWARD_CENTS,
  };
}

/**
 * Pedido do app aprovado: vira selo se os itens somam R$ 50+ (subtotal,
 * não o cobrado — usar saldo não faz perder o selo). Idempotente pelo
 * refKey (retry de webhook não dá dois selos).
 */
export async function recordAppOrderStamp(order: {
  id: string;
  userId: string;
  subtotalCents: number;
  createdAt: Date;
}): Promise<void> {
  if (order.subtotalCents < LOYALTY_MIN_ORDER_CENTS) return;
  await prisma.loyaltyStamp.createMany({
    data: [
      {
        userId: order.userId,
        source: "APP",
        refKey: `order:${order.id}`,
        amountCents: order.subtotalCents,
        purchasedAt: order.createdAt,
      },
    ],
    skipDuplicates: true,
  });
}

/**
 * Credita o prêmio de cada cartão de 10 selos completo que ainda não foi
 * pago — pode ser mais de um de uma vez (várias compras da loja chegando
 * juntas). Idempotente via unique(userId, cycleNumber): ciclo já pago
 * falha em silêncio (P2002), sem creditar duas vezes. Devolve quantos
 * cartões foram pagos agora.
 */
export async function checkLoyaltyStampReward(userId: string): Promise<number> {
  const [stamps, paidCycles] = await Promise.all([
    countStamps(userId),
    prisma.loyaltyStampCycle.findMany({ where: { userId }, select: { cycleNumber: true } }),
  ]);
  const completed = Math.floor(stamps / LOYALTY_STAMP_CARD_SIZE);
  const paid = new Set(paidCycles.map((c) => c.cycleNumber));

  let credited = 0;
  for (let cycleNumber = 1; cycleNumber <= completed; cycleNumber++) {
    if (paid.has(cycleNumber)) continue;
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
      credited++;
    } catch (error) {
      const isDuplicateCycle =
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";
      if (!isDuplicateCycle) throw error;
    }
  }
  return credited;
}

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/**
 * Compras no balcão viram selos: busca as vendas da pessoa na Trier (pelo
 * CPF verificado) desde que criou a conta e grava as de R$ 50+ que ainda
 * não viraram selo. Só conta pra quem tem o CPF confirmado — sem isso não
 * dá pra saber de quem é a compra. `notify`: avisa por push dos selos
 * novos (nunca na primeira vez, que é só o retroativo). Devolve quantos
 * selos entraram.
 */
export async function syncStoreStamps(userId: string, { notify = false } = {}): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cpf: true, phone: true, cpfVerifiedAt: true, createdAt: true, deletedAt: true, loyaltySyncedAt: true },
  });
  if (!user || user.deletedAt || !user.cpfVerifiedAt || !user.cpf) return 0;

  const since = user.createdAt.toISOString().slice(0, 10);
  const [sales, appOrders] = await Promise.all([
    getStoreSalesForUser(user.cpf, user.phone, since),
    prisma.order.findMany({
      where: { userId, trierNumeroNota: { not: null } },
      select: { trierNumeroNota: true },
    }),
  ]);
  const appNotas = new Set(appOrders.map((o) => o.trierNumeroNota!));
  const qualifying = qualifyingStoreSales(sales, appNotas);

  const { count } = qualifying.length
    ? await prisma.loyaltyStamp.createMany({
        data: qualifying.map((sale) => ({
          userId,
          source: "LOJA" as const,
          refKey: `venda:${sale.vendaId}`,
          amountCents: sale.totalCents,
          purchasedAt: new Date(sale.dataEmissao),
        })),
        skipDuplicates: true,
      })
    : { count: 0 };
  await prisma.user.update({ where: { id: userId }, data: { loyaltySyncedAt: new Date() } });

  if (count === 0) return 0;
  const credited = await checkLoyaltyStampReward(userId);

  if (notify && user.loyaltySyncedAt) {
    const { stampsFilled } = computeStampCycle(await countStamps(userId));
    await sendPushToUser(userId, credited > 0
      ? {
          title: "Cartão fidelidade completo! 🎉",
          body: `Você ganhou ${formatCents(LOYALTY_REWARD_CENTS * credited)} de crédito no seu saldo.`,
          data: { screen: "fidelidade" },
        }
      : {
          title: "Compra registrada no cartão fidelidade ⭐",
          body: `Você tem ${stampsFilled} de ${LOYALTY_STAMP_CARD_SIZE} selos. Faltam ${LOYALTY_STAMP_CARD_SIZE - stampsFilled} pro prêmio de ${formatCents(LOYALTY_REWARD_CENTS)}.`,
          data: { screen: "fidelidade" },
        }
    ).catch((error) => console.error("[fidelidade] push do selo:", error));
  }
  return count;
}

/** Abrindo o cartão: busca as compras da loja se a última busca é antiga. */
export async function syncStoreStampsIfStale(userId: string, maxAgeMs = STORE_SYNC_ON_VIEW_MS): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { loyaltySyncedAt: true } });
  if (user?.loyaltySyncedAt && Date.now() - user.loyaltySyncedAt.getTime() < maxAgeMs) return;
  await syncStoreStamps(userId);
}

/**
 * Cron: passa pelas contas com CPF verificado (as mais antigas sem busca
 * primeiro, um lote por vez) e transforma as compras novas da loja em
 * selos, avisando por push. Devolve quantos selos entraram.
 */
export async function dispatchLoyaltyStoreSync(now: Date = new Date()): Promise<number> {
  const staleBefore = new Date(now.getTime() - STORE_SYNC_MAX_AGE_MS);
  const users = await prisma.user.findMany({
    where: {
      cpfVerifiedAt: { not: null },
      deletedAt: null,
      OR: [{ loyaltySyncedAt: null }, { loyaltySyncedAt: { lt: staleBefore } }],
    },
    orderBy: { loyaltySyncedAt: { sort: "asc", nulls: "first" } },
    take: STORE_SYNC_BATCH,
    select: { id: true },
  });
  let total = 0;
  for (const user of users) {
    try {
      total += await syncStoreStamps(user.id, { notify: true });
    } catch (error) {
      console.error("[fidelidade] sincronizar compras da loja:", error);
    }
  }
  return total;
}
