import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { getWalletBalanceCents } from "@/lib/wallet";
import { sendPushToUser } from "@/lib/push/expoPush";
import { startOfLocalDay } from "@/lib/timeZone";
import {
  CREDIT_VALIDITY_MONTHS,
  WALLET_MIN_PURCHASE_CENTS,
  computeExpiry,
  validateRedemption,
} from "@/lib/wallet/walletRules";

/**
 * Uso dos créditos no balcão. O cliente gera no app um código de 6
 * dígitos (10 min, uso único); o atendente (ou gestor) digita, vê o saldo,
 * informa a compra e confirma — o débito sai na hora, travado contra uso
 * duplo e saldo negativo. O atendente dá o mesmo desconto na Trier.
 */

const CODE_TTL_MS = 10 * 60 * 1000;
/** Código com menos que isso de vida é trocado por um novo ao reabrir. */
const CODE_REUSE_MIN_MS = 3 * 60 * 1000;

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export type StaffAccess = { atendente: boolean; gestor: boolean };

export async function getStaffAccess(userId: string): Promise<StaffAccess> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAtendente: true, isGestor: true } });
  return { atendente: Boolean(user?.isAtendente || user?.isGestor), gestor: Boolean(user?.isGestor) };
}

async function requireStaff(userId: string): Promise<StaffAccess> {
  const access = await getStaffAccess(userId);
  if (!access.atendente) throw new Error("Sem permissão");
  return access;
}

// ---------- cliente ----------

export type WalletOverview = {
  balanceCents: number;
  minPurchaseCents: number;
  validityMonths: number;
  /** Saldo por data de vencimento, o mais próximo primeiro. */
  upcoming: { amountCents: number; expiresAt: string }[];
  entries: { id: string; description: string; amountCents: number; createdAt: string }[];
};

export async function getWalletOverview(userId: string): Promise<WalletOverview> {
  const [balanceCents, all] = await Promise.all([
    getWalletBalanceCents(userId),
    prisma.walletEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, amountCents: true, createdAt: true, source: true },
    }),
  ]);
  const { upcoming } = computeExpiry(
    all.map((e) => ({ amountCents: e.amountCents, createdAt: e.createdAt, isExpiration: e.source === "WALLET_EXPIRATION" })),
    new Date()
  );
  return {
    balanceCents,
    minPurchaseCents: WALLET_MIN_PURCHASE_CENTS,
    validityMonths: CREDIT_VALIDITY_MONTHS,
    upcoming: upcoming.map((u) => ({ amountCents: u.amountCents, expiresAt: u.expiresAt.toISOString() })),
    entries: all.slice(0, 50).map((e) => ({
      id: e.id,
      description: e.description,
      amountCents: e.amountCents,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

/** Código pra mostrar no balcão (reaproveita o atual se ainda tem vida). */
export async function createRedeemCode(userId: string): Promise<{ code: string; expiresAt: string }> {
  const now = new Date();
  const active = await prisma.walletRedeemCode.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: new Date(now.getTime() + CODE_REUSE_MIN_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (active) return { code: active.code, expiresAt: active.expiresAt.toISOString() };

  // Limpa os vencidos desta pessoa (o código é único na tabela inteira).
  await prisma.walletRedeemCode.deleteMany({ where: { userId, usedAt: null, expiresAt: { lte: now } } });
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    try {
      const created = await prisma.walletRedeemCode.create({
        data: { userId, code, expiresAt: new Date(now.getTime() + CODE_TTL_MS) },
      });
      return { code: created.code, expiresAt: created.expiresAt.toISOString() };
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error;
      // código já existe (de outra pessoa): se estiver vencido, libera
      await prisma.walletRedeemCode.deleteMany({ where: { code, usedAt: null, expiresAt: { lte: now } } });
    }
  }
  throw new Error("Não foi possível gerar o código. Tente de novo.");
}

/** O app do cliente acompanha o código: usado (com quanto) ou vencido. */
export async function getRedeemCodeStatus(
  userId: string,
  code: string
): Promise<{ status: "active" | "used" | "expired"; amountCents?: number; balanceCents: number }> {
  const row = await prisma.walletRedeemCode.findUnique({ where: { code } });
  const balanceCents = await getWalletBalanceCents(userId);
  if (!row || row.userId !== userId) return { status: "expired", balanceCents };
  if (row.usedAt) {
    const redemption = await prisma.walletRedemption.findFirst({
      // o resgate é gravado na mesma transação que marca o código
      where: { userId, createdAt: { gte: new Date(row.usedAt.getTime() - 60_000) } },
      orderBy: { createdAt: "desc" },
      select: { amountCents: true },
    });
    return { status: "used", amountCents: redemption?.amountCents, balanceCents };
  }
  return { status: row.expiresAt > new Date() ? "active" : "expired", balanceCents };
}

// ---------- balcão ----------

async function findUsableCode(code: string) {
  const row = await prisma.walletRedeemCode.findUnique({
    where: { code: code.replace(/\D/g, "") },
    include: { user: { select: { id: true, name: true, deletedAt: true } } },
  });
  if (!row || row.user.deletedAt) throw new Error("Código não encontrado. Peça pro cliente gerar de novo.");
  if (row.usedAt) throw new Error("Esse código já foi usado. Peça pro cliente gerar um novo.");
  if (row.expiresAt <= new Date()) throw new Error("Código vencido. Peça pro cliente gerar um novo.");
  return row;
}

export async function lookupRedeemCode(
  staffId: string,
  code: string
): Promise<{ customerName: string; balanceCents: number; minPurchaseCents: number; expiresAt: string }> {
  await requireStaff(staffId);
  const row = await findUsableCode(code);
  return {
    customerName: row.user.name,
    balanceCents: await getWalletBalanceCents(row.userId),
    minPurchaseCents: WALLET_MIN_PURCHASE_CENTS,
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function redeemAtCounter(
  staffId: string,
  input: { code: string; purchaseCents: number; amountCents: number; saleNumber?: string | null }
): Promise<{ customerName: string; amountCents: number; balanceCents: number }> {
  await requireStaff(staffId);
  const row = await findUsableCode(input.code);
  const saleNumber = input.saleNumber?.trim().slice(0, 40) || null;

  const result = await prisma.$transaction(async (tx) => {
    // Trava o cliente: dois resgates ao mesmo tempo esperam um pelo outro,
    // e o segundo já vê o saldo menor.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${row.userId} FOR UPDATE`;
    const claimed = await tx.walletRedeemCode.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("Esse código já foi usado. Peça pro cliente gerar um novo.");

    const balanceCents = await getWalletBalanceCents(row.userId, tx);
    const error = validateRedemption({ purchaseCents: input.purchaseCents, amountCents: input.amountCents, balanceCents });
    if (error) throw new Error(error);

    const entry = await tx.walletEntry.create({
      data: {
        userId: row.userId,
        amountCents: -input.amountCents,
        source: "WALLET_REDEMPTION",
        description: `Usado no balcão${saleNumber ? ` (venda ${saleNumber})` : ""}`,
      },
    });
    await tx.walletRedemption.create({
      data: {
        userId: row.userId,
        staffId,
        amountCents: input.amountCents,
        purchaseCents: input.purchaseCents,
        saleNumber,
        walletEntryId: entry.id,
      },
    });
    return { balanceCents: balanceCents - input.amountCents };
  });

  void sendPushToUser(row.userId, {
    title: `💳 Você usou ${formatCents(input.amountCents)} de créditos`,
    body: `Saldo: ${formatCents(result.balanceCents)}. Obrigado por comprar na Farmácia Conviva!`,
    data: { screen: "carteira" },
  }).catch((error) => console.error("[carteira] push do resgate:", error));

  return { customerName: row.user.name, amountCents: input.amountCents, balanceCents: result.balanceCents };
}

export type RedemptionView = {
  id: string;
  customerName: string;
  staffName: string;
  amountCents: number;
  purchaseCents: number;
  saleNumber: string | null;
  createdAt: string;
  reversed: boolean;
};

/** Resgates do dia: o gestor vê todos; o atendente, os dele. */
export async function listRedemptionsToday(
  staffId: string
): Promise<{ items: RedemptionView[]; totalCents: number; canReverse: boolean }> {
  const access = await requireStaff(staffId);
  const rows = await prisma.walletRedemption.findMany({
    where: { createdAt: { gte: startOfLocalDay() }, ...(access.gestor ? {} : { staffId }) },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } }, staff: { select: { name: true } } },
  });
  const items = rows.map((r) => ({
    id: r.id,
    customerName: r.user.name,
    staffName: r.staff.name,
    amountCents: r.amountCents,
    purchaseCents: r.purchaseCents,
    saleNumber: r.saleNumber,
    createdAt: r.createdAt.toISOString(),
    reversed: r.reversedAt != null,
  }));
  return {
    items,
    totalCents: items.filter((i) => !i.reversed).reduce((s, i) => s + i.amountCents, 0),
    canReverse: access.gestor,
  };
}

/** Gestor desfaz um resgate lançado errado: o crédito volta pro cliente. */
export async function reverseRedemption(gestorId: string, redemptionId: string): Promise<void> {
  const access = await getStaffAccess(gestorId);
  if (!access.gestor) throw new Error("Só o gestor pode estornar");
  const redemption = await prisma.walletRedemption.findUnique({ where: { id: redemptionId } });
  if (!redemption) throw new Error("Resgate não encontrado");
  if (redemption.reversedAt) return;
  await prisma.$transaction([
    prisma.walletRedemption.update({
      where: { id: redemptionId },
      data: { reversedAt: new Date(), reversedById: gestorId, walletEntryId: null },
    }),
    ...(redemption.walletEntryId ? [prisma.walletEntry.delete({ where: { id: redemption.walletEntryId } })] : []),
  ]);
  void sendPushToUser(redemption.userId, {
    title: "💳 Crédito devolvido",
    body: `${formatCents(redemption.amountCents)} voltaram pro seu saldo.`,
    data: { screen: "carteira" },
  }).catch(() => {});
}

// ---------- vencimento ----------

/**
 * Cron: lança o vencimento do crédito que passou de 12 meses sem uso.
 * Idempotente por dia (refKey "exp:<user>:<dia>") e pela própria conta
 * (computeExpiry desconta o que já foi lançado).
 */
export async function dispatchWalletExpirations(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - CREDIT_VALIDITY_MONTHS);
  const candidates = await prisma.walletEntry.groupBy({
    by: ["userId"],
    where: { amountCents: { gt: 0 }, createdAt: { lte: cutoff } },
  });

  let expired = 0;
  for (const { userId } of candidates) {
    const entries = await prisma.walletEntry.findMany({
      where: { userId },
      select: { amountCents: true, createdAt: true, source: true },
    });
    const { toExpireCents } = computeExpiry(
      entries.map((e) => ({ amountCents: e.amountCents, createdAt: e.createdAt, isExpiration: e.source === "WALLET_EXPIRATION" })),
      now
    );
    if (toExpireCents <= 0) continue;
    try {
      await prisma.walletEntry.create({
        data: {
          userId,
          amountCents: -toExpireCents,
          source: "WALLET_EXPIRATION",
          description: `Crédito vencido (mais de ${CREDIT_VALIDITY_MONTHS} meses sem uso)`,
          refKey: `exp:${userId}:${now.toISOString().slice(0, 10)}`,
        },
      });
      expired++;
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") console.error("[carteira] vencimento:", error);
    }
  }
  return expired;
}
