import { describe, expect, it } from "vitest";
import { TIP_INTERVAL_DAYS, dueTipIndexes } from "@/lib/goals/goalCore";

function daysFrom(base: Date, days: number): Date {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

const START = new Date("2026-01-01T00:00:00Z");

describe("dueTipIndexes", () => {
  it("no dia da criação da meta, a primeira dica (índice 0) já está devida", () => {
    const goal = { startDate: START, endDate: daysFrom(START, 60) };
    expect(dueTipIndexes(goal, START)).toEqual([0]);
  });

  it("antes do intervalo passar, só a primeira dica está devida", () => {
    const goal = { startDate: START, endDate: daysFrom(START, 60) };
    const now = daysFrom(START, TIP_INTERVAL_DAYS - 1);
    expect(dueTipIndexes(goal, now)).toEqual([0]);
  });

  it("exatamente no intervalo (5 dias), a segunda dica já está devida", () => {
    const goal = { startDate: START, endDate: daysFrom(START, 60) };
    const now = daysFrom(START, TIP_INTERVAL_DAYS);
    expect(dueTipIndexes(goal, now)).toEqual([0, 1]);
  });

  it("nunca perde dica atrasada: muito tempo depois, manda todas as devidas de uma vez", () => {
    const goal = { startDate: START, endDate: daysFrom(START, 60) };
    const now = daysFrom(START, 27); // 27/5 = 5.4 -> índices 0..5 (6 dicas)
    expect(dueTipIndexes(goal, now)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("meta de 60 dias nunca ultrapassa o índice correspondente ao seu próprio prazo", () => {
    const goal = { startDate: START, endDate: daysFrom(START, 60) };
    const farFuture = daysFrom(START, 10000);
    // 60 / 5 = 12 -> índices 0..12 (13 dicas), nunca mais que isso
    expect(dueTipIndexes(goal, farFuture)).toHaveLength(13);
  });

  it("meta mais longa (120 dias) permite mais dicas que uma de 60 dias — intervalo fixo, não a quantidade", () => {
    const goal60 = { startDate: START, endDate: daysFrom(START, 60) };
    const goal120 = { startDate: START, endDate: daysFrom(START, 120) };
    const farFuture = daysFrom(START, 10000);
    expect(dueTipIndexes(goal120, farFuture).length).toBeGreaterThan(
      dueTipIndexes(goal60, farFuture).length
    );
  });

  it("antes da meta começar (relógio do servidor atrasado, por exemplo), não deve nenhuma dica", () => {
    const goal = { startDate: START, endDate: daysFrom(START, 60) };
    const before = daysFrom(START, -1);
    expect(dueTipIndexes(goal, before)).toEqual([]);
  });

  it("prazo inválido (fim antes ou igual ao início) nunca deve dica nenhuma", () => {
    expect(dueTipIndexes({ startDate: START, endDate: START }, START)).toEqual([]);
    expect(dueTipIndexes({ startDate: START, endDate: daysFrom(START, -5) }, START)).toEqual([]);
  });
});
