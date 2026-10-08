import { describe, expect, it } from "vitest";
import { monthBounds, renderReportHtml, summarizeMeasurements, type ReportData } from "@/lib/report/reportCore";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("período do relatório", () => {
  it("mês passado inteiro", () => {
    expect(monthBounds("2026-09", d("2026-10-07"))).toEqual({ start: d("2026-09-01"), end: d("2026-09-30") });
  });

  it("mês atual vai só até hoje", () => {
    expect(monthBounds("2026-10", d("2026-10-07"))).toEqual({ start: d("2026-10-01"), end: d("2026-10-07") });
  });

  it("mês futuro ou mal formatado: null", () => {
    expect(monthBounds("2026-11", d("2026-10-07"))).toBeNull();
    expect(monthBounds("10/2026", d("2026-10-07"))).toBeNull();
    expect(monthBounds("2026-13", d("2026-10-07"))).toBeNull();
  });
});

describe("resumo das medições", () => {
  const row = (over: Record<string, number | null>) => ({
    type: "PRESSAO" as const,
    measuredAt: new Date(),
    pressaoSistolica: null,
    pressaoDiastolica: null,
    pesoKg: null,
    percentualGordura: null,
    glicemiaMgDl: null,
    ...over,
  });

  it("pressão: média, maior e menor", () => {
    expect(
      summarizeMeasurements("PRESSAO", [row({ pressaoSistolica: 130, pressaoDiastolica: 85 }), row({ pressaoSistolica: 120, pressaoDiastolica: 75 })])
    ).toBe("Média 125/80 mmHg · maior 130/85 · menor 120/75");
  });

  it("peso: variação no mês", () => {
    expect(summarizeMeasurements("PESO", [row({ pesoKg: 80 }), row({ pesoKg: 78.5 })])).toBe("De 80 kg pra 78,5 kg (-1,5 kg no mês)");
  });

  it("sem medição: null", () => {
    expect(summarizeMeasurements("GLICEMIA", [])).toBeNull();
  });
});

describe("página do relatório", () => {
  const data: ReportData = {
    patientName: "Maria <script>alert(1)</script>",
    monthLabel: "Outubro de 2026",
    periodLabel: "01/10 a 07/10/2026",
    medications: [{ name: "LOSARTANA 50MG", horarios: ["08:00", "20:00"], taken: 12, expected: 14 }],
    measurements: [],
    routineDays: 6,
    periodDays: 7,
    generatedAt: "07/10/2026 10:00",
  };

  it("escapa texto vindo do usuário (sem HTML injetado)", () => {
    const html = renderReportHtml(data);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Maria &lt;script&gt;");
  });

  it("mostra adesão e rotina", () => {
    const html = renderReportHtml(data);
    expect(html).toContain("12 de 14");
    expect(html).toContain("86%");
    expect(html).toContain("<strong>6</strong> de 7 dias");
  });
});
