import { describe, expect, it } from "vitest";
import { computeNextStreak, isNextChapterAvailable } from "@/lib/wisdom/wisdomCore";

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

describe("isNextChapterAvailable", () => {
  it("primeiro capítulo sempre disponível (nunca leu nada ainda)", () => {
    expect(isNextChapterAvailable(0, null, day(1), 8)).toBe(true);
  });

  it("mesmo dia da última leitura: ainda bloqueado", () => {
    expect(isNextChapterAvailable(1, day(5), day(5), 8)).toBe(false);
  });

  it("dia seguinte à última leitura: libera", () => {
    expect(isNextChapterAvailable(1, day(5), day(6), 8)).toBe(true);
  });

  it("vários dias depois da última leitura: continua liberado", () => {
    expect(isNextChapterAvailable(1, day(5), day(10), 8)).toBe(true);
  });

  it("já leu todos os capítulos disponíveis: não libera mais nenhum", () => {
    expect(isNextChapterAvailable(8, day(5), day(20), 8)).toBe(false);
  });
});

describe("computeNextStreak", () => {
  it("primeira leitura de todas: streak vira 1", () => {
    expect(computeNextStreak(null, day(1), 0)).toBe(1);
  });

  it("leu ontem: streak continua subindo", () => {
    expect(computeNextStreak(day(5), day(6), 3)).toBe(4);
  });

  it("pulou um ou mais dias: streak reseta pra 1", () => {
    expect(computeNextStreak(day(5), day(8), 7)).toBe(1);
  });
});
