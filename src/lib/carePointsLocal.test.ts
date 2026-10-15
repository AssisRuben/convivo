import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tabDataCache", () => ({ getCached: vi.fn(), setCached: vi.fn(), markStale: vi.fn() }));
vi.mock("@/lib/tabPrefetch", () => ({ HOME_CACHE_KEY: "home" }));

import { applyCareAction } from "@/lib/carePointsLocal";
import { LOCAL_POINTS } from "@/lib/carePointsLocal";
import { CARE_POINTS, DAILY_ROUTINE_POINTS_CAP, WEEKLY_MEASUREMENT_DAYS } from "@/lib/points/pointsCore";
import { CHALLENGE_POINTS } from "@/lib/points/challengesCore";
import type { ApiHomeDashboard } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

function dash(overrides: Partial<NonNullable<ApiHomeDashboard["carePoints"]>> = {}): ApiHomeDashboard {
  return {
    nextDose: null,
    repurchaseReady: [],
    loyalty: { stampsFilled: 0, stampsTotal: 10, totalRewardCents: 0 },
    activePromotionsCount: 0,
    wisdom: { chaptersRead: 0, totalChapters: 1, bestStreak: 0 },
    faith: { chaptersRead: 0, totalChapters: 1, bestStreak: 0 },
    rotina: { doneToday: 0, totalToday: 3 },
    saude: null,
    weeklyChallenges: [
      { id: "cuidado5", title: "", progress: 4, target: 5, points: 30, completed: false },
      { id: "medicao3", title: "", progress: 0, target: 3, points: 30, completed: false },
      { id: "leitura4", title: "", progress: 0, target: 4, points: 30, completed: false },
    ],
    carePoints: {
      balance: 100,
      pointsPerReward: 500,
      rewardCents: 500,
      monthRewardCents: 0,
      monthCapCents: 1000,
      todayPoints: 0,
      canRedeem: true,
      routinePointsToday: 0,
      caredToday: false,
      measuredToday: false,
      measurementDaysThisWeek: 0,
      readingPaidToday: false,
      ...overrides,
    },
  };
}

describe("regras locais = regras do servidor", () => {
  it("mesmos valores e limites", () => {
    expect(LOCAL_POINTS.DOSE).toBe(CARE_POINTS.DOSE);
    expect(LOCAL_POINTS.ROTINA).toBe(CARE_POINTS.ROTINA);
    expect(LOCAL_POINTS.MEDICAO).toBe(CARE_POINTS.MEDICAO);
    expect(LOCAL_POINTS.LEITURA).toBe(CARE_POINTS.LEITURA);
    expect(LOCAL_POINTS.DAILY_ROUTINE_CAP).toBe(DAILY_ROUTINE_POINTS_CAP);
    expect(LOCAL_POINTS.WEEKLY_MEASUREMENT_DAYS).toBe(WEEKLY_MEASUREMENT_DAYS);
    expect(LOCAL_POINTS.CHALLENGE).toBe(CHALLENGE_POINTS);
  });
});

describe("pontos na hora", () => {
  it("dose: +2, conta no dia e fecha o desafio de 5 dias (+30)", () => {
    const { dashboard, delta, routineDelta } = applyCareAction(dash(), {
      kind: "check",
      isDose: true,
      eligible: true,
      scheduledToday: true,
    });
    expect(routineDelta).toBe(2);
    expect(delta).toBe(32);
    expect(dashboard.carePoints!.todayPoints).toBe(32);
    expect(dashboard.carePoints!.balance).toBe(132);
    expect(dashboard.weeklyChallenges![0].completed).toBe(true);
    expect(dashboard.rotina.doneToday).toBe(1);
  });

  it("teto da Rotina e cuidado criado hoje", () => {
    expect(applyCareAction(dash({ routinePointsToday: 9, caredToday: true }), { kind: "check", isDose: true, eligible: true, scheduledToday: true }).delta).toBe(1);
    expect(applyCareAction(dash({ caredToday: true }), { kind: "check", isDose: false, eligible: false, scheduledToday: true }).delta).toBe(0);
  });

  it("desmarcar devolve o que ganhou", () => {
    const { dashboard, delta } = applyCareAction(dash({ routinePointsToday: 4, todayPoints: 4, caredToday: true }), {
      kind: "uncheck",
      earned: 2,
      scheduledToday: true,
    });
    expect(delta).toBe(-2);
    expect(dashboard.carePoints!.routinePointsToday).toBe(2);
    expect(dashboard.carePoints!.balance).toBe(98);
  });

  it("medição: 1 por dia, até 3 dias na semana", () => {
    expect(applyCareAction(dash(), { kind: "medicao" }).delta).toBe(5);
    expect(applyCareAction(dash({ measuredToday: true }), { kind: "medicao" }).delta).toBe(0);
    const quarta = applyCareAction(dash({ measurementDaysThisWeek: 3 }), { kind: "medicao" });
    expect(quarta.delta).toBe(0);
    expect(quarta.dashboard.weeklyChallenges![1].progress).toBe(1); // conta pro desafio mesmo sem ponto
  });

  it("leitura: só o primeiro capítulo do dia vale ponto", () => {
    expect(applyCareAction(dash(), { kind: "leitura" }).delta).toBe(3);
    expect(applyCareAction(dash({ readingPaidToday: true }), { kind: "leitura" }).delta).toBe(0);
  });

  it("converte em crédito ao passar de 500, com CPF e dentro do teto", () => {
    const comCpf = applyCareAction(dash({ balance: 499, caredToday: true }), { kind: "check", isDose: true, eligible: true, scheduledToday: true });
    expect(comCpf.dashboard.carePoints).toMatchObject({ balance: 1, monthRewardCents: 500 });
    const semCpf = applyCareAction(dash({ balance: 499, caredToday: true, canRedeem: false }), { kind: "check", isDose: true, eligible: true, scheduledToday: true });
    expect(semCpf.dashboard.carePoints).toMatchObject({ balance: 501, monthRewardCents: 0 });
    const noTeto = applyCareAction(dash({ balance: 499, caredToday: true, monthRewardCents: 1000 }), { kind: "check", isDose: true, eligible: true, scheduledToday: true });
    expect(noTeto.dashboard.carePoints).toMatchObject({ balance: 501, monthRewardCents: 1000 });
  });

  it("servidor antigo (sem os limites): não prevê", () => {
    const old = dash();
    delete old.carePoints!.routinePointsToday;
    expect(applyCareAction(old, { kind: "leitura" }).delta).toBe(0);
  });
});
