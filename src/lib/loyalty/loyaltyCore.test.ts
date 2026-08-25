import { describe, expect, it } from "vitest";
import { LOYALTY_STAMP_CARD_SIZE, computeStampCycle } from "@/lib/loyalty/loyaltyCore";

describe("computeStampCycle", () => {
  it("0 pedidos qualificados = cartão vazio, nenhum ciclo completado", () => {
    expect(computeStampCycle(0)).toEqual({ stampsFilled: 0, justCompletedCycle: null });
  });

  it("selos preenchidos é o resto da divisão por 10", () => {
    expect(computeStampCycle(3).stampsFilled).toBe(3);
    expect(computeStampCycle(9).stampsFilled).toBe(9);
  });

  it("exatamente 10 pedidos qualificados completa o ciclo 1", () => {
    expect(computeStampCycle(10)).toEqual({ stampsFilled: 0, justCompletedCycle: 1 });
  });

  it("exatamente 20 pedidos qualificados completa o ciclo 2", () => {
    expect(computeStampCycle(20)).toEqual({ stampsFilled: 0, justCompletedCycle: 2 });
  });

  it("11 pedidos = ciclo 1 já premiado antes, cartão novo com 1 selo", () => {
    expect(computeStampCycle(11)).toEqual({ stampsFilled: 1, justCompletedCycle: null });
  });

  it("múltiplo de LOYALTY_STAMP_CARD_SIZE sempre indica ciclo completo", () => {
    const qualifyingOrders = LOYALTY_STAMP_CARD_SIZE * 4;
    expect(computeStampCycle(qualifyingOrders).justCompletedCycle).toBe(4);
  });
});
