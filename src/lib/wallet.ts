import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Saldo atual = soma de todas as WalletEntry (créditos positivos, débitos
 * negativos) — ledger puro, sem coluna de saldo cacheada em lugar nenhum.
 * Aceita opcionalmente um client de transação, pra approveOrder poder ler
 * o saldo e debitar na mesma transação (ver orderCore.ts).
 */
export async function getWalletBalanceCents(
  userId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<number> {
  const result = await client.walletEntry.aggregate({
    where: { userId },
    _sum: { amountCents: true },
  });
  return result._sum.amountCents ?? 0;
}

/**
 * Lê `walletDiscountCents` de um body de request — nunca confia no valor
 * (createOrderForItems/approveOrder sempre travam contra subtotal e saldo
 * de verdade), só garante que é um inteiro positivo antes de repassar.
 */
export function parseWalletDiscountCents(body: unknown): number {
  const value = (body as { walletDiscountCents?: unknown } | null)?.walletDiscountCents;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}
