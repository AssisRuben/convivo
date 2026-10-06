import { describe, expect, it } from "vitest";
import {
  conversionsAvailable,
  routinePointsAllowed,
  DAILY_ROUTINE_POINTS_CAP,
  MONTHLY_CAP_CENTS,
  POINTS_PER_REWARD,
  REWARD_CENTS,
} from "@/lib/points/pointsCore";

describe("conversão de pontos em crédito", () => {
  it("regras combinadas: 500 pontos = R$ 5, teto R$ 10/mês", () => {
    expect(POINTS_PER_REWARD).toBe(500);
    expect(REWARD_CENTS).toBe(500);
    expect(MONTHLY_CAP_CENTS).toBe(1000);
  });

  it("menos de 500 pontos: nada a converter", () => {
    expect(conversionsAvailable(499, 0)).toBe(0);
  });

  it("converte quantas o saldo permitir, até o teto do mês", () => {
    expect(conversionsAvailable(500, 0)).toBe(1);
    expect(conversionsAvailable(1200, 0)).toBe(2);
    expect(conversionsAvailable(5000, 0)).toBe(2); // teto: R$ 10 = 2 conversões
  });

  it("teto já atingido no mês: espera o mês seguinte, pontos ficam guardados", () => {
    expect(conversionsAvailable(900, 1000)).toBe(0);
    expect(conversionsAvailable(900, 500)).toBe(1);
  });
});

describe("limite diário de pontos da Rotina", () => {
  it("dá os pontos inteiros enquanto cabe", () => {
    expect(routinePointsAllowed(2, 0)).toBe(2);
  });

  it("corta no que falta pro limite do dia", () => {
    expect(routinePointsAllowed(2, DAILY_ROUTINE_POINTS_CAP - 1)).toBe(1);
  });

  it("limite atingido: zero", () => {
    expect(routinePointsAllowed(2, DAILY_ROUTINE_POINTS_CAP)).toBe(0);
  });
});
