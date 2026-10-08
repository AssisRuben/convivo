import { describe, expect, it } from "vitest";
import { carePetStage, CARE_PET_STAGES } from "@/constants/carePetStages";

describe("bichinho do Home pela sequência de dias", () => {
  it("sem sequência: sonolento, próxima fase em 1 dia", () => {
    expect(carePetStage(0)).toMatchObject({ tier: { label: "Sonolento" }, next: { label: "Filhote", daysLeft: 1 } });
  });

  it("5 dias: Crescendo, faltam 2 pra Em forma", () => {
    expect(carePetStage(5)).toMatchObject({ tier: { label: "Crescendo" }, next: { label: "Em forma", daysLeft: 2 } });
  });

  it("14 dias ganha a coroa", () => {
    expect(carePetStage(14).tier.crown).toBe(true);
  });

  it("última fase não tem próxima", () => {
    expect(carePetStage(400)).toMatchObject({ tier: { label: "Supremo" }, next: null });
  });

  it("fases em ordem crescente de dias", () => {
    const days = CARE_PET_STAGES.map((s) => s.minDays);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });
});
