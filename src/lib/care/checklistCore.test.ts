import { describe, expect, it } from "vitest";
import { computeOverallStreakFromDates, validateRoutineInput } from "@/lib/care/checklistCore";

const day = (n: number) => new Date(Date.UTC(2026, 8, n));
const key = (n: number) => day(n).toISOString().slice(0, 10);

describe("computeOverallStreakFromDates", () => {
  it("feito hoje e nos 3 dias anteriores: streak 4", () => {
    const done = new Set([key(25), key(24), key(23), key(22)]);
    expect(computeOverallStreakFromDates(done, day(25))).toBe(4);
  });

  it("nada feito hoje: streak 0, mesmo com dias anteriores feitos", () => {
    const done = new Set([key(24), key(23)]);
    expect(computeOverallStreakFromDates(done, day(25))).toBe(0);
  });

  it("pulou um dia no meio: sequência conta só até a quebra", () => {
    const done = new Set([key(25), key(24), key(22)]); // faltou 23
    expect(computeOverallStreakFromDates(done, day(25))).toBe(2);
  });

  it("nunca fez nada: streak 0", () => {
    expect(computeOverallStreakFromDates(new Set(), day(25))).toBe(0);
  });
});

describe("validateRoutineInput", () => {
  it("aceita horário e dias válidos", () => {
    expect(validateRoutineInput({ title: " Treino ", category: "TREINO", timeOfDay: "08:00", daysOfWeek: [1, 3] })).toBe(
      "Treino"
    );
  });

  it("rejeita título vazio", () => {
    expect(() => validateRoutineInput({ title: "  ", category: "OUTRO", daysOfWeek: [] })).toThrow();
  });

  it("rejeita horário mal formatado", () => {
    expect(() =>
      validateRoutineInput({ title: "X", category: "OUTRO", timeOfDay: "25:00", daysOfWeek: [] })
    ).toThrow();
  });

  it("rejeita dia da semana fora de 0-6", () => {
    expect(() => validateRoutineInput({ title: "X", category: "OUTRO", daysOfWeek: [7] })).toThrow();
  });
});
