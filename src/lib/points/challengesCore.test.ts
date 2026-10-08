import { describe, expect, it } from "vitest";
import { computeChallenges } from "@/lib/points/challengesCore";

const e = (reason: string, refKey: string) => ({ reason, refKey });

describe("desafios da semana", () => {
  it("cuidado conta dias distintos, não quantidade de marcações", () => {
    const entries = [
      e("DOSE", "check:a:2026-10-05"),
      e("DOSE", "check:b:2026-10-05"),
      e("ROTINA", "check:c:2026-10-05"),
      e("DOSE", "check:a:2026-10-06"),
    ];
    expect(computeChallenges(entries).find((c) => c.id === "cuidado5")?.progress).toBe(2);
  });

  it("medição e leitura contam um por lançamento", () => {
    const entries = [
      e("MEDICAO", "saude:2026-10-05"),
      e("MEDICAO", "saude:2026-10-06"),
      e("LEITURA", "wisdom:estoicismo:2"),
      e("LEITURA", "faith:marcos:3"),
    ];
    const result = computeChallenges(entries);
    expect(result.find((c) => c.id === "medicao3")?.progress).toBe(2);
    expect(result.find((c) => c.id === "leitura4")?.progress).toBe(2);
  });

  it("progresso não passa da meta", () => {
    const entries = ["05", "06", "07", "08", "09", "10", "11"].map((d) => e("DOSE", `check:a:2026-10-${d}`));
    expect(computeChallenges(entries).find((c) => c.id === "cuidado5")).toMatchObject({ progress: 5, target: 5 });
  });

  it("semana vazia: tudo zerado", () => {
    expect(computeChallenges([]).every((c) => c.progress === 0)).toBe(true);
  });
});
