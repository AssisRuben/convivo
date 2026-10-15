/**
 * Regras do crédito (carteira), sem banco — testáveis.
 *
 * Vencimento: cada crédito vence CREDIT_VALIDITY_MONTHS depois de ganho.
 * O uso consome sempre o crédito mais antigo ainda válido (o que vence
 * primeiro sai primeiro). O que sobrar de um crédito quando ele vence
 * vira um lançamento de WALLET_EXPIRATION — assim o saldo continua sendo
 * só a soma do extrato.
 */

export const WALLET_MIN_PURCHASE_CENTS = 5000; // compra mínima pra usar crédito (R$ 50)
export const CREDIT_VALIDITY_MONTHS = 12;

export type LedgerEntry = {
  amountCents: number;
  createdAt: Date;
  /** Lançamento de vencimento já gravado (não consome lote: só registra). */
  isExpiration: boolean;
};

export function creditExpiresAt(earnedAt: Date): Date {
  const d = new Date(earnedAt);
  d.setUTCMonth(d.getUTCMonth() + CREDIT_VALIDITY_MONTHS);
  return d;
}

type Lot = { remaining: number; expiresAt: Date };

/**
 * Percorre o extrato em ordem e devolve: quanto já devia ter vencido até
 * `now` e ainda não foi lançado, e os lotes vivos (saldo por data de
 * vencimento, o mais próximo primeiro).
 */
export function computeExpiry(
  entries: LedgerEntry[],
  now: Date
): { toExpireCents: number; upcoming: { amountCents: number; expiresAt: Date }[] } {
  const sorted = [...entries].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || b.amountCents - a.amountCents
  );
  let lots: Lot[] = [];
  let expiredRemainder = 0;
  let recordedExpirations = 0;

  // Lotes que venceram até `at` saem da fila; o que sobrava neles venceu.
  const expireUntil = (at: Date) => {
    const alive: Lot[] = [];
    for (const lot of lots) {
      if (lot.expiresAt.getTime() <= at.getTime()) expiredRemainder += lot.remaining;
      else alive.push(lot);
    }
    lots = alive;
  };

  for (const entry of sorted) {
    expireUntil(entry.createdAt);
    if (entry.isExpiration) {
      recordedExpirations += -entry.amountCents;
      continue;
    }
    if (entry.amountCents > 0) {
      lots.push({ remaining: entry.amountCents, expiresAt: creditExpiresAt(entry.createdAt) });
      continue;
    }
    // Uso (ou estorno negativo): consome os lotes mais antigos.
    let debit = -entry.amountCents;
    for (const lot of lots) {
      if (debit <= 0) break;
      const used = Math.min(lot.remaining, debit);
      lot.remaining -= used;
      debit -= used;
    }
    lots = lots.filter((lot) => lot.remaining > 0);
  }
  expireUntil(now);

  return {
    toExpireCents: Math.max(expiredRemainder - recordedExpirations, 0),
    upcoming: lots
      .filter((lot) => lot.remaining > 0)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())
      .map((lot) => ({ amountCents: lot.remaining, expiresAt: lot.expiresAt })),
  };
}

/** "12,50" / "12.50" / "R$ 12" -> centavos; inválido = null. */
export function parseMoneyToCents(raw: string): number | null {
  const clean = raw.replace(/[R$\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** Confere um resgate no balcão; devolve o erro pra mostrar ou null. */
export function validateRedemption(input: {
  purchaseCents: number;
  amountCents: number;
  balanceCents: number;
}): string | null {
  const { purchaseCents, amountCents, balanceCents } = input;
  if (!Number.isInteger(purchaseCents) || purchaseCents < WALLET_MIN_PURCHASE_CENTS) {
    return "O crédito vale em compras a partir de R$ 50,00.";
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) return "Informe quanto de crédito vai usar.";
  if (amountCents > balanceCents) return "O cliente não tem esse saldo.";
  if (amountCents > purchaseCents) return "O crédito não pode passar do valor da compra.";
  return null;
}

/** Conteúdo do QR que o cliente mostra no balcão. */
export const REDEEM_QR_PREFIX = "convivo-credito:";

export function redeemQrValue(code: string): string {
  return `${REDEEM_QR_PREFIX}${code}`;
}

/** Lê o QR escaneado: só aceita o do Convivo (ou 6 dígitos puros). */
export function parseRedeemQr(data: string): string | null {
  const text = data.trim();
  const match = text.startsWith(REDEEM_QR_PREFIX)
    ? text.slice(REDEEM_QR_PREFIX.length).match(/^\d{6}$/)
    : text.match(/^\d{6}$/);
  return match ? match[0] : null;
}
