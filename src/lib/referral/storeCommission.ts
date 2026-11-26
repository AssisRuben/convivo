import { prisma } from "@/lib/prisma";
import type { StoreSale } from "@/lib/pharmacyDb";

/** 2% da margem bruta pro amigo que indicou, a cada compra do indicado. */
export const REFERRAL_COMMISSION_RATE = 0.02;
/** 5% pro vendedor vinculado — papel mais ativo, atendimento presencial. */
export const VENDEDOR_COMMISSION_RATE = 0.05;

type StoreCommissionEntry = {
  userId: string;
  amountCents: number;
  source: "REFERRAL_PURCHASE_COMMISSION" | "VENDEDOR_PURCHASE_COMMISSION";
  description: string;
  refKey: string;
};

const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3, sem horário de verão desde 2019

/** Dia do vínculo no horário de Brasília ("YYYY-MM-DD"), mesmo calendário
 * de StoreSale.dataEmissao (data da nota na loja). */
export function linkedDay(codeLinkedAt: Date): string {
  return new Date(codeLinkedAt.getTime() - BRASILIA_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Comissão das compras da loja física (Trier) — mesmas taxas e mesma base
 * (margem bruta) dos pedidos do app. Pura, pra dar pra testar sem banco:
 * recebe as vendas que ainda não são pedido do app e devolve os
 * lançamentos. Só conta venda a partir do dia do vínculo (`since`,
 * "YYYY-MM-DD", ver linkedDay) — nunca do cadastro. refKey por venda e por
 * papel: rodar de novo (cron a cada 6h, abrir o cartão) nunca credita duas
 * vezes, e quem vincular o código depois de remover outro não recebe venda
 * que já foi paga.
 */
export function buildStoreCommissionEntries(
  sales: StoreSale[],
  buyer: { name: string; referredById: string | null; vendedorId: string | null },
  since: string
): StoreCommissionEntry[] {
  const entries: StoreCommissionEntry[] = [];
  for (const sale of sales) {
    if (sale.dataEmissao < since || sale.marginCents <= 0) continue;

    if (buyer.referredById) {
      const amountCents = Math.round(sale.marginCents * REFERRAL_COMMISSION_RATE);
      if (amountCents > 0) {
        entries.push({
          userId: buyer.referredById,
          amountCents,
          source: "REFERRAL_PURCHASE_COMMISSION",
          description: `Comissão de 2% pela compra de ${buyer.name} na loja`,
          refKey: `comissao-amigo:venda:${sale.vendaId}`,
        });
      }
    }

    if (buyer.vendedorId) {
      const amountCents = Math.round(sale.marginCents * VENDEDOR_COMMISSION_RATE);
      if (amountCents > 0) {
        entries.push({
          userId: buyer.vendedorId,
          amountCents,
          source: "VENDEDOR_PURCHASE_COMMISSION",
          description: `Comissão de 5% pela compra de ${buyer.name} na loja`,
          refKey: `comissao-vendedor:venda:${sale.vendaId}`,
        });
      }
    }
  }
  return entries;
}

/**
 * Credita a comissão das compras da loja de `userId` pra quem ele tem
 * vinculado. `sales` já sem os pedidos do app (esses pagam comissão em
 * approveOrder). Devolve quantos lançamentos novos entraram.
 */
export async function creditStoreSaleCommissions(userId: string, sales: StoreSale[]): Promise<number> {
  if (sales.length === 0) return 0;
  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, codeLinkedAt: true, referredById: true, vendedorId: true },
  });
  // Sem data do vínculo não tem como saber a partir de quando vale — todo
  // vínculo novo grava a data, e os antigos foram preenchidos na migração
  // 20261126191000_backfill_code_linked_at.
  if (!buyer?.codeLinkedAt || (!buyer.referredById && !buyer.vendedorId)) return 0;

  const entries = buildStoreCommissionEntries(sales, buyer, linkedDay(buyer.codeLinkedAt));
  if (entries.length === 0) return 0;

  const { count } = await prisma.walletEntry.createMany({ data: entries, skipDuplicates: true });
  return count;
}
