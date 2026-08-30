import { describe, expect, it } from "vitest";
import {
  estimateRunOutDate,
  daysBetween,
  validateInput,
  type MedicationTrackingInput,
} from "@/lib/medications/medicationCore";

const PURCHASE = new Date("2026-01-01T00:00:00Z");

const VALID_INPUT: MedicationTrackingInput = {
  productName: "Sertralina 50mg",
  codigoProduto: 17084,
  purchaseDate: "2026-01-01",
  totalUnits: 60,
  unitsPerDose: 1,
  horarios: ["08:00", "20:00"],
};

describe("validateInput", () => {
  it("não lança pra entrada válida", () => {
    expect(() => validateInput(VALID_INPUT)).not.toThrow();
  });

  it("rejeita nome vazio ou só espaço", () => {
    expect(() => validateInput({ ...VALID_INPUT, productName: "" })).toThrow(
      "Nome do medicamento é obrigatório"
    );
    expect(() => validateInput({ ...VALID_INPUT, productName: "   " })).toThrow(
      "Nome do medicamento é obrigatório"
    );
  });

  it("rejeita quantidade total zero, negativa ou não inteira", () => {
    expect(() => validateInput({ ...VALID_INPUT, totalUnits: 0 })).toThrow(
      "Quantidade total inválida"
    );
    expect(() => validateInput({ ...VALID_INPUT, totalUnits: -5 })).toThrow(
      "Quantidade total inválida"
    );
    expect(() => validateInput({ ...VALID_INPUT, totalUnits: 1.5 })).toThrow(
      "Quantidade total inválida"
    );
  });

  it("rejeita unidades por dose zero, negativa ou não inteira", () => {
    expect(() => validateInput({ ...VALID_INPUT, unitsPerDose: 0 })).toThrow(
      "Unidades por dose inválidas"
    );
    expect(() => validateInput({ ...VALID_INPUT, unitsPerDose: -1 })).toThrow(
      "Unidades por dose inválidas"
    );
  });

  it("rejeita lista de horários vazia — precisa de pelo menos um", () => {
    expect(() => validateInput({ ...VALID_INPUT, horarios: [] })).toThrow(
      "Informe pelo menos um horário"
    );
  });

  it("rejeita horário fora do formato HH:mm (inclui a hora inválida na mensagem)", () => {
    expect(() => validateInput({ ...VALID_INPUT, horarios: ["25:00"] })).toThrow(
      "Horário inválido: 25:00"
    );
    expect(() => validateInput({ ...VALID_INPUT, horarios: ["8:00"] })).toThrow(/Horário inválido/);
    expect(() => validateInput({ ...VALID_INPUT, horarios: ["08:00", "aa:bb"] })).toThrow(
      "Horário inválido: aa:bb"
    );
  });

  it("aceita horários nos limites válidos (00:00 e 23:59)", () => {
    expect(() => validateInput({ ...VALID_INPUT, horarios: ["00:00", "23:59"] })).not.toThrow();
  });

  it("rejeita data de compra inválida", () => {
    expect(() => validateInput({ ...VALID_INPUT, purchaseDate: "não é uma data" })).toThrow(
      "Data da compra inválida"
    );
  });
});

describe("estimateRunOutDate", () => {
  it("consumo diário simples: 60 unidades, 1 por dose, 2 doses/dia = 30 dias", () => {
    const result = estimateRunOutDate(PURCHASE, 60, 1, 2);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-31");
  });

  it("arredonda pra baixo quando não divide exato — nunca promete mais dias do que o estoque cobre", () => {
    // 65 / (1*2) = 32.5 -> 32 dias, não 33 (33 já não teria comprimido suficiente)
    const result = estimateRunOutDate(PURCHASE, 65, 1, 2);
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-02");
  });

  it("unitsPerDose maior que 1: 90 unidades, 3 por dose, 1 dose/dia = 30 dias", () => {
    const result = estimateRunOutDate(PURCHASE, 90, 3, 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-31");
  });

  it("sem horário cadastrado (dosesPerDay 0) — consumo diário zero, acaba na mesma data da compra, nunca divide por zero", () => {
    const result = estimateRunOutDate(PURCHASE, 60, 1, 0);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-01");
  });

  it("quantidade menor que uma dose já acaba no dia da compra (0 dias de estoque)", () => {
    const result = estimateRunOutDate(PURCHASE, 1, 2, 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-01-01");
  });
});

describe("daysBetween", () => {
  it("mesma data = 0 dias", () => {
    expect(daysBetween(PURCHASE, PURCHASE)).toBe(0);
  });

  it("1 dia depois = 1", () => {
    const nextDay = new Date("2026-01-02T00:00:00Z");
    expect(daysBetween(PURCHASE, nextDay)).toBe(1);
  });

  it("data anterior = negativo (já passou do previsto)", () => {
    const previousDay = new Date("2025-12-31T00:00:00Z");
    expect(daysBetween(PURCHASE, previousDay)).toBe(-1);
  });

  it("30 dias entre compra e estimativa de acabar, batendo com estimateRunOutDate", () => {
    const runOut = estimateRunOutDate(PURCHASE, 60, 1, 2);
    expect(daysBetween(PURCHASE, runOut)).toBe(30);
  });
});
