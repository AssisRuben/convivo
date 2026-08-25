import { describe, expect, it } from "vitest";
import {
  REFERRAL_COMMISSION_RATE,
  VENDEDOR_COMMISSION_RATE,
  calculateOrderMarginCents,
  clampWalletDiscount,
  parseCashTenderedCents,
  parsePaymentMethod,
} from "@/lib/orders/orderCore";

describe("calculateOrderMarginCents", () => {
  it("soma a margem (preço - custo) vezes quantidade por item", () => {
    const cents = calculateOrderMarginCents([
      { unitPriceCents: 1000, quantity: 2, product: { costCents: 600 } }, // (1000-600)*2 = 800
      { unitPriceCents: 500, quantity: 1, product: { costCents: 300 } }, // 200
    ]);
    expect(cents).toBe(1000);
  });

  it("ignora itens sem costCents cadastrado (margem desconhecida, nunca estimada)", () => {
    const cents = calculateOrderMarginCents([
      { unitPriceCents: 1000, quantity: 1, product: { costCents: null } },
      { unitPriceCents: 500, quantity: 1, product: { costCents: 200 } },
    ]);
    expect(cents).toBe(300);
  });

  it("ignora itens com margem negativa (vendido abaixo do custo) em vez de subtrair", () => {
    const cents = calculateOrderMarginCents([
      { unitPriceCents: 100, quantity: 1, product: { costCents: 200 } }, // margem -100, ignorado
      { unitPriceCents: 500, quantity: 1, product: { costCents: 200 } }, // margem 300
    ]);
    expect(cents).toBe(300);
  });

  it("retorna 0 pra lista vazia", () => {
    expect(calculateOrderMarginCents([])).toBe(0);
  });
});

describe("comissões calculadas sobre a margem", () => {
  it("comissão de amigo é 2% da margem, arredondada", () => {
    const marginCents = calculateOrderMarginCents([
      { unitPriceCents: 1000, quantity: 1, product: { costCents: 0 } },
    ]);
    expect(Math.round(marginCents * REFERRAL_COMMISSION_RATE)).toBe(20);
  });

  it("comissão de vendedor é 5% da margem — maior que a de amigo", () => {
    const marginCents = calculateOrderMarginCents([
      { unitPriceCents: 1000, quantity: 1, product: { costCents: 0 } },
    ]);
    expect(Math.round(marginCents * VENDEDOR_COMMISSION_RATE)).toBe(50);
    expect(VENDEDOR_COMMISSION_RATE).toBeGreaterThan(REFERRAL_COMMISSION_RATE);
  });
});

describe("clampWalletDiscount", () => {
  it("usa o valor pedido quando cabe no subtotal e no saldo", () => {
    expect(clampWalletDiscount(500, 2000, 1000)).toBe(500);
  });

  it("nunca deixa o desconto passar do subtotal, mesmo com saldo maior", () => {
    expect(clampWalletDiscount(5000, 2000, 10000)).toBe(2000);
  });

  it("nunca deixa o desconto passar do saldo disponível, mesmo pedindo mais", () => {
    expect(clampWalletDiscount(5000, 10000, 300)).toBe(300);
  });

  it("nunca fica negativo, mesmo com valor pedido negativo", () => {
    expect(clampWalletDiscount(-100, 2000, 1000)).toBe(0);
  });

  it("saldo zerado sempre resulta em desconto zero", () => {
    expect(clampWalletDiscount(500, 2000, 0)).toBe(0);
  });
});

describe("parsePaymentMethod", () => {
  it("aceita os 3 valores válidos do enum", () => {
    expect(parsePaymentMethod("ONLINE_MP")).toBe("ONLINE_MP");
    expect(parsePaymentMethod("CARTAO_PRESENCIAL")).toBe("CARTAO_PRESENCIAL");
    expect(parsePaymentMethod("DINHEIRO")).toBe("DINHEIRO");
  });

  it("rejeita valor desconhecido, nunca deixa passar sem checar contra o enum", () => {
    expect(parsePaymentMethod("PIX")).toBeNull();
    expect(parsePaymentMethod("")).toBeNull();
  });

  it("rejeita tipos que não são string, undefined/null incluso", () => {
    expect(parsePaymentMethod(undefined)).toBeNull();
    expect(parsePaymentMethod(null)).toBeNull();
    expect(parsePaymentMethod(123)).toBeNull();
  });
});

describe("parseCashTenderedCents", () => {
  it("aceita número positivo e trunca casas decimais", () => {
    expect(parseCashTenderedCents(5000)).toBe(5000);
    expect(parseCashTenderedCents(50.9)).toBe(50);
  });

  it("valor zero, negativo, ou não numérico vira undefined (não confia sem checar)", () => {
    expect(parseCashTenderedCents(0)).toBeUndefined();
    expect(parseCashTenderedCents(-500)).toBeUndefined();
    expect(parseCashTenderedCents("5000")).toBeUndefined();
    expect(parseCashTenderedCents(undefined)).toBeUndefined();
    expect(parseCashTenderedCents(NaN)).toBeUndefined();
  });
});
