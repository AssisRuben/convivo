import { describe, expect, it } from "vitest";
import { computeNextOccurrence, computeStreakDays, isScheduledDay } from "@/lib/care/routineDetailCore";

// 2026-09-25 é sexta (weekday 5 — getUTCDay: dom=0..sáb=6)
const day = (n: number) => new Date(Date.UTC(2026, 8, n));
const key = (n: number) => day(n).toISOString().slice(0, 10);

describe("isScheduledDay", () => {
  it("lista vazia = todo dia", () => {
    expect(isScheduledDay([], 0)).toBe(true);
    expect(isScheduledDay([], 6)).toBe(true);
  });

  it("só os dias marcados", () => {
    expect(isScheduledDay([1, 3, 5], 5)).toBe(true);
    expect(isScheduledDay([1, 3, 5], 2)).toBe(false);
  });
});

describe("computeStreakDays", () => {
  it("todo dia, feito hoje e nos 3 dias anteriores: streak 4", () => {
    const completed = new Set([key(25), key(24), key(23), key(22)]);
    expect(computeStreakDays([], completed, day(25))).toBe(4);
  });

  it("todo dia, ainda não feito hoje mas feito ontem: streak 1 (graça de hoje)", () => {
    const completed = new Set([key(24)]);
    expect(computeStreakDays([], completed, day(25))).toBe(1);
  });

  it("pulou um dia no meio: sequência quebra ali", () => {
    const completed = new Set([key(25), key(24), key(22)]); // faltou 23
    expect(computeStreakDays([], completed, day(25))).toBe(2);
  });

  it("dias específicos (seg/qua/sex): dia fora da lista não quebra nem conta", () => {
    // 25=sex(5), 24=qui(4, não programado), 23=qua(3, feito), 22=ter(2, não programado)
    const completed = new Set([key(25), key(23)]);
    expect(computeStreakDays([1, 3, 5], completed, day(25))).toBe(2);
  });

  it("nunca fez nada: streak 0", () => {
    expect(computeStreakDays([], new Set(), day(25))).toBe(0);
  });
});

describe("computeNextOccurrence", () => {
  it("sem horário fixo: null", () => {
    expect(computeNextOccurrence(null, [], false, 600, 5)).toBeNull();
  });

  it("horário ainda não passou hoje e não foi feito: hoje mesmo", () => {
    const next = computeNextOccurrence("14:30", [], false, 600, 5); // 10:00 -> 14:30
    expect(next).toEqual({ daysAhead: 0, minutesUntil: 270 });
  });

  it("já foi feito hoje: pula pro próximo dia programado", () => {
    const next = computeNextOccurrence("14:30", [], true, 600, 5);
    expect(next).toEqual({ daysAhead: 1, minutesUntil: 24 * 60 + 870 - 600 });
  });

  it("horário já passou hoje e ainda não foi feito: continua hoje, com minutos negativos", () => {
    const next = computeNextOccurrence("08:00", [], false, 600, 5); // 10:00 já passou de 08:00
    expect(next).toEqual({ daysAhead: 0, minutesUntil: -120 });
  });

  it("dias específicos: pula até o próximo dia da lista", () => {
    // hoje é sexta (5); próximo dia da lista [1,3] é segunda, 3 dias à frente
    const next = computeNextOccurrence("08:00", [1, 3], false, 600, 5);
    expect(next?.daysAhead).toBe(3);
  });
});
