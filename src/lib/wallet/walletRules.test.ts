import { describe, expect, it } from "vitest";
import { computeExpiry, creditExpiresAt, parseMoneyToCents, validateRedemption } from "@/lib/wallet/walletRules";

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);
const credit = (cents: number, iso: string) => ({ amountCents: cents, createdAt: d(iso), isExpiration: false });
const use = (cents: number, iso: string) => ({ amountCents: -cents, createdAt: d(iso), isExpiration: false });
const expired = (cents: number, iso: string) => ({ amountCents: -cents, createdAt: d(iso), isExpiration: true });

describe("vencimento do crédito (12 meses, o mais antigo sai primeiro)", () => {
  it("vence 12 meses depois", () => {
    expect(creditExpiresAt(d("2026-10-15")).toISOString().slice(0, 10)).toBe("2027-10-15");
  });

  it("antes de vencer: nada a lançar, mostra quando vence", () => {
    const r = computeExpiry([credit(1000, "2026-10-01")], d("2027-01-01"));
    expect(r.toExpireCents).toBe(0);
    expect(r.upcoming).toEqual([{ amountCents: 1000, expiresAt: creditExpiresAt(d("2026-10-01")) }]);
  });

  it("uso consome o mais antigo; vence só o que sobrou dele", () => {
    const r = computeExpiry(
      [credit(1000, "2026-01-01"), credit(500, "2026-06-01"), use(700, "2026-08-01")],
      d("2027-02-01")
    );
    expect(r.toExpireCents).toBe(300); // 1000 - 700 do lote de janeiro
    expect(r.upcoming.map((u) => u.amountCents)).toEqual([500]);
  });

  it("vencimento já lançado não lança de novo", () => {
    const r = computeExpiry(
      [credit(1000, "2026-01-01"), use(700, "2026-08-01"), expired(300, "2027-01-02")],
      d("2027-03-01")
    );
    expect(r.toExpireCents).toBe(0);
  });

  it("uso depois do vencimento não come crédito vencido", () => {
    const r = computeExpiry(
      [credit(1000, "2026-01-01"), credit(500, "2026-12-01"), use(400, "2027-02-01")],
      d("2027-02-02")
    );
    expect(r.toExpireCents).toBe(1000);
    expect(r.upcoming.map((u) => u.amountCents)).toEqual([100]);
  });
});

describe("valor digitado", () => {
  it("vírgula, ponto, R$ e milhar", () => {
    expect(parseMoneyToCents("12,50")).toBe(1250);
    expect(parseMoneyToCents("R$ 80")).toBe(8000);
    expect(parseMoneyToCents("1.234,56")).toBe(123456);
    expect(parseMoneyToCents("12.5")).toBe(1250);
    expect(parseMoneyToCents("abc")).toBeNull();
  });
});

describe("resgate no balcão", () => {
  it("compra mínima de R$ 50", () => {
    expect(validateRedemption({ purchaseCents: 4999, amountCents: 100, balanceCents: 1000 })).toMatch(/R\$ 50/);
  });
  it("não passa do saldo nem do valor da compra", () => {
    expect(validateRedemption({ purchaseCents: 6000, amountCents: 1500, balanceCents: 1000 })).toMatch(/saldo/);
    expect(validateRedemption({ purchaseCents: 6000, amountCents: 7000, balanceCents: 9000 })).toMatch(/valor da compra/);
  });
  it("pode cobrir a compra inteira", () => {
    expect(validateRedemption({ purchaseCents: 6000, amountCents: 6000, balanceCents: 9000 })).toBeNull();
  });
});
