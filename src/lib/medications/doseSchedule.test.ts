import { describe, expect, it } from "vitest";
import {
  countScheduledDays,
  describeDaysOfWeek,
  firstUncoveredDay,
  normalizeDaysOfWeek,
  trackingDaysOfWeek,
} from "@/lib/medications/doseSchedule";
import {
  estimateRunOutDate,
  monthlyDoseSummary,
  unitsRemaining,
} from "@/lib/medications/medicationCore";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
const QUINTA = 4;

describe("dias programados", () => {
  it("todo dia conta o intervalo inteiro", () => {
    expect(countScheduledDays(d("2026-10-01"), d("2026-10-31"), [])).toBe(31);
  });

  it("toda quinta em outubro/2026: 5 quintas", () => {
    expect(countScheduledDays(d("2026-10-01"), d("2026-10-31"), [QUINTA])).toBe(5);
  });

  it("intervalo vazio ou invertido: zero", () => {
    expect(countScheduledDays(d("2026-10-08"), d("2026-10-07"), [])).toBe(0);
  });

  it("7 dias marcados = todo dia; ordena e tira repetido", () => {
    expect(normalizeDaysOfWeek([0, 1, 2, 3, 4, 5, 6])).toEqual([]);
    expect(normalizeDaysOfWeek([5, 1, 5])).toEqual([1, 5]);
  });

  it("dias da ficha vêm do primeiro horário ativo", () => {
    expect(trackingDaysOfWeek([{ daysOfWeek: [1], active: false }, { daysOfWeek: [QUINTA], active: true }])).toEqual([QUINTA]);
    expect(trackingDaysOfWeek([])).toEqual([]);
  });

  it("descrição curta", () => {
    expect(describeDaysOfWeek([])).toBe("todo dia");
    expect(describeDaysOfWeek([QUINTA])).toBe("toda quinta");
    expect(describeDaysOfWeek([0])).toBe("todo domingo");
    expect(describeDaysOfWeek([1, 3, 5])).toBe("seg, qua e sex");
  });
});

describe("Ozempic: 4 doses, 1 por vez, toda quinta", () => {
  // 2026-10-08 é quinta
  const start = d("2026-10-08");

  it("acaba na 5ª quinta (4 semanas), não em 4 dias", () => {
    expect(iso(estimateRunOutDate(start, 4, 1, 1, [QUINTA]))).toBe("2026-11-05");
  });

  it("todo dia continua igual: 4 comprimidos acabam em 4 dias", () => {
    expect(iso(estimateRunOutDate(start, 4, 1, 1, []))).toBe("2026-10-12");
    expect(iso(firstUncoveredDay(start, 0, []))).toBe("2026-10-08");
  });

  it("contagem numa segunda: acaba na quinta que o estoque não cobre", () => {
    // 1 dose a partir de segunda 12/10 cobre a quinta 15; acaba na quinta 22
    expect(iso(estimateRunOutDate(d("2026-10-12"), 1, 1, 1, [QUINTA]))).toBe("2026-10-22");
  });

  it("estoque só baixa nas quintas já passadas (a de hoje ainda não)", () => {
    expect(unitsRemaining(4, 1, 1, start, d("2026-10-08"), [QUINTA])).toBe(4);
    expect(unitsRemaining(4, 1, 1, start, d("2026-10-14"), [QUINTA])).toBe(3);
    expect(unitsRemaining(4, 1, 1, start, d("2026-10-16"), [QUINTA])).toBe(2);
    // todo dia: 8 dias depois, 8 a menos
    expect(unitsRemaining(30, 1, 1, start, d("2026-10-16"), [])).toBe(22);
  });

  it("no mês, espera uma dose por quinta desde o início", () => {
    const resumo = monthlyDoseSummary(start, 1, [d("2026-10-08"), d("2026-10-15")], d("2026-10-22"), [QUINTA]);
    expect(resumo).toMatchObject({ taken: 2, expected: 3 });
  });
});
