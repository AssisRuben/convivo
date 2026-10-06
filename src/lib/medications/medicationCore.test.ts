import { describe, expect, it } from "vitest";
import {
  estimateRunOutDate,
  daysBetween,
  diffHorarios,
  medicationStart,
  stockBase,
  unitsPerPackageFromName,
  unitsRemaining,
  monthlyDoseSummary,
  supplyCoversTreatment,
  treatmentProgress,
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

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("validateInput — duração do tratamento", () => {
  it("aceita uso contínuo (null/ausente) e tratamento de 1 a 365 dias", () => {
    expect(() => validateInput({ ...VALID_INPUT, treatmentDays: null })).not.toThrow();
    expect(() => validateInput({ ...VALID_INPUT, treatmentDays: 7 })).not.toThrow();
    expect(() => validateInput({ ...VALID_INPUT, treatmentDays: 365 })).not.toThrow();
  });

  it("rejeita zero, negativo, fração e mais de 365", () => {
    for (const treatmentDays of [0, -3, 2.5, 366]) {
      expect(() => validateInput({ ...VALID_INPUT, treatmentDays })).toThrow(
        "Duração do tratamento inválida"
      );
    }
  });
});

describe("treatmentProgress", () => {
  it("uso contínuo não tem dia de tratamento", () => {
    expect(treatmentProgress(d("2026-10-01"), null, d("2026-10-05"))).toBeNull();
  });

  it("dia da compra é o dia 1; 4 dias depois é o dia 5 de 7", () => {
    expect(treatmentProgress(d("2026-10-01"), 7, d("2026-10-01"))).toEqual({
      day: 1,
      totalDays: 7,
      ended: false,
    });
    expect(treatmentProgress(d("2026-10-01"), 7, d("2026-10-05"))).toEqual({
      day: 5,
      totalDays: 7,
      ended: false,
    });
  });

  it("último dia ainda vale; o dia seguinte já terminou", () => {
    expect(treatmentProgress(d("2026-10-01"), 7, d("2026-10-07"))?.ended).toBe(false);
    expect(treatmentProgress(d("2026-10-01"), 7, d("2026-10-08"))?.ended).toBe(true);
  });

  it("ignora o horário gravado na data da compra", () => {
    const compraComHora = new Date("2026-10-01T15:30:00Z");
    expect(treatmentProgress(compraComHora, 7, d("2026-10-05"))?.day).toBe(5);
  });
});

describe("monthlyDoseSummary", () => {
  it("conta do dia 1 do mês até hoje: 5 dias x 2 doses = 10 previstas", () => {
    const tomadas = [d("2026-10-01"), d("2026-10-01"), d("2026-10-02"), d("2026-10-05")];
    expect(monthlyDoseSummary(d("2026-08-10"), 2, tomadas, d("2026-10-05"))).toMatchObject({
      taken: 4,
      expected: 10,
    });
  });

  it("compra no meio do mês: começa a contar no dia da compra", () => {
    expect(monthlyDoseSummary(d("2026-10-04"), 1, [d("2026-10-04")], d("2026-10-05"))).toMatchObject({
      taken: 1,
      expected: 2,
    });
  });

  it("ignora doses do mês anterior e de antes da compra", () => {
    const tomadas = [d("2026-09-30"), d("2026-10-03"), d("2026-10-05")];
    expect(monthlyDoseSummary(d("2026-10-04"), 1, tomadas, d("2026-10-05"))).toMatchObject({
      taken: 1,
      expected: 2,
    });
  });

  it("compra no futuro (data errada) não gera previsão negativa", () => {
    expect(monthlyDoseSummary(d("2026-10-20"), 1, [], d("2026-10-05")).expected).toBe(0);
  });
});

describe("supplyCoversTreatment", () => {
  it("uso contínuo sempre precisa de recompra", () => {
    expect(supplyCoversTreatment(d("2026-10-01"), null, d("2026-10-05"), 1)).toBe(false);
  });

  it("tratamento que termina antes do remédio acabar não pede recompra", () => {
    // dia 5 de 7 -> faltam 2 dias; remédio acaba em 3
    expect(supplyCoversTreatment(d("2026-10-01"), 7, d("2026-10-05"), 3)).toBe(true);
  });

  it("remédio acaba antes do fim do tratamento: precisa recomprar", () => {
    // dia 5 de 10 -> faltam 5 dias; remédio acaba em 1
    expect(supplyCoversTreatment(d("2026-10-01"), 10, d("2026-10-05"), 1)).toBe(false);
  });

  it("tratamento já encerrado não pede recompra", () => {
    expect(supplyCoversTreatment(d("2026-09-01"), 7, d("2026-10-05"), -20)).toBe(true);
  });
});

describe("diffHorarios — edição da ficha x itens da Rotina", () => {
  const atuais = [
    { id: "i8", timeOfDay: "08:00" },
    { id: "i20", timeOfDay: "20:00" },
  ];

  it("horário mantido preserva o item (histórico de tomado fica)", () => {
    expect(diffHorarios(atuais, ["08:00", "20:00"])).toEqual({
      manter: ["i8", "i20"],
      desativar: [],
      criar: [],
    });
  });

  it("troca 20:00 por 14:00: desativa um e cria outro", () => {
    expect(diffHorarios(atuais, ["08:00", "14:00"])).toEqual({
      manter: ["i8"],
      desativar: ["i20"],
      criar: ["14:00"],
    });
  });

  it("item duplicado no mesmo horário: fica só um", () => {
    const comDuplicado = [...atuais, { id: "i8b", timeOfDay: "08:00" }];
    expect(diffHorarios(comDuplicado, ["08:00"])).toEqual({
      manter: ["i8"],
      desativar: ["i20", "i8b"],
      criar: [],
    });
  });
});

describe("data de início (Comecei a tomar em)", () => {
  it("cadastro manual: sem data da compra é válido", () => {
    expect(() => validateInput({ ...VALID_INPUT, purchaseDate: null, codigoProduto: null })).not.toThrow();
  });

  it("data de início no futuro é recusada", () => {
    expect(() => validateInput({ ...VALID_INPUT, startDate: "2999-01-01" })).toThrow(/futuro/);
  });

  it("data de início mal formatada é recusada", () => {
    expect(() => validateInput({ ...VALID_INPUT, startDate: "06/10/2026" })).toThrow(/início/);
  });

  it("conta a partir do início, não da compra: comprado em maio, começou hoje = não acabou", () => {
    const tracking = { purchaseDate: new Date("2026-05-07"), startDate: new Date("2026-10-06") };
    const today = new Date("2026-10-06");
    expect(medicationStart(tracking)).toEqual(new Date("2026-10-06"));
    expect(treatmentProgress(medicationStart(tracking), 5, today)).toEqual({ day: 1, totalDays: 5, ended: false });
    // 10 comprimidos, 1 por dia: acaba em 10 dias, não "já deve ter acabado"
    const runOut = estimateRunOutDate(medicationStart(tracking), 10, 1, 1);
    expect(daysBetween(today, runOut)).toBe(10);
  });

  it("linha antiga sem data de início cai na data da compra", () => {
    expect(medicationStart({ purchaseDate: new Date("2026-05-07"), startDate: null })).toEqual(new Date("2026-05-07"));
  });
});

describe("estoque separado do tratamento", () => {
  const d = (s: string) => new Date(s + "T00:00:00Z");

  it("comprimidos por caixa a partir do nome", () => {
    expect(unitsPerPackageFromName("CONVI OMEGA 3 1000MG 120CAP")).toBe(120);
    expect(unitsPerPackageFromName("AZITROMICINA 500MG 5CP REV")).toBe(5);
    expect(unitsPerPackageFromName("ALLEGRA 180MG 10CP REV")).toBe(10);
    expect(unitsPerPackageFromName("CEFTRIAXONA SOD 1G C/DIL FA")).toBeNull();
    // "500MG" não é contagem de comprimidos
    expect(unitsPerPackageFromName("DIPIRONA 500MG")).toBeNull();
  });

  it("conta o estoque da última contagem, não do início do tratamento", () => {
    // começou há 20 dias, informou hoje que tem 10: restam 10, não zero
    const tracking = { purchaseDate: d("2026-09-01"), startDate: d("2026-09-16"), stockCountedAt: d("2026-10-06") };
    expect(stockBase(tracking)).toEqual(d("2026-10-06"));
    expect(unitsRemaining(10, 1, 1, stockBase(tracking), d("2026-10-06"))).toBe(10);
    expect(daysBetween(d("2026-10-06"), estimateRunOutDate(stockBase(tracking), 10, 1, 1))).toBe(10);
  });

  it("restante desconta o consumo desde a contagem e não fica negativo", () => {
    expect(unitsRemaining(120, 1, 2, d("2026-10-01"), d("2026-10-06"))).toBe(110);
    expect(unitsRemaining(5, 1, 1, d("2026-09-01"), d("2026-10-06"))).toBe(0);
  });

  it("linha antiga sem contagem cai no início, e depois na compra", () => {
    expect(stockBase({ purchaseDate: d("2026-05-07"), startDate: d("2026-09-28"), stockCountedAt: null })).toEqual(d("2026-09-28"));
    expect(stockBase({ purchaseDate: d("2026-05-07"), startDate: null, stockCountedAt: null })).toEqual(d("2026-05-07"));
  });
});
