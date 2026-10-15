import type { ApiCarePointsSummary, ApiHomeDashboard, ApiWeeklyChallenge } from "@/lib/api";
import { getCached, markStale, setCached } from "@/lib/tabDataCache";
import { HOME_CACHE_KEY } from "@/lib/tabPrefetch";

/**
 * Pontos de cuidado na hora: o app aplica as mesmas regras do servidor
 * (lib/points/pointsCore.ts) assim que a pessoa age, e a próxima busca do
 * Home confere com o banco. Mudou uma regra lá, muda aqui também.
 */
export const LOCAL_POINTS = {
  DOSE: 2,
  ROTINA: 1,
  MEDICAO: 5,
  LEITURA: 3,
  DAILY_ROUTINE_CAP: 10,
  WEEKLY_MEASUREMENT_DAYS: 3,
  CHALLENGE: 30,
} as const;

export type CareAction =
  /** Marcou dose/cuidado. `eligible` = vale ponto hoje (não criado hoje). */
  | { kind: "check"; isDose: boolean; eligible: boolean; scheduledToday: boolean }
  /** Desmarcou: devolve o que tinha ganhado. */
  | { kind: "uncheck"; earned: number; scheduledToday: boolean }
  | { kind: "medicao" }
  | { kind: "leitura" };

function bumpChallenge(
  challenges: ApiWeeklyChallenge[] | undefined,
  id: string
): { challenges: ApiWeeklyChallenge[] | undefined; bonus: number } {
  if (!challenges) return { challenges, bonus: 0 };
  let bonus = 0;
  const next = challenges.map((c) => {
    if (c.id !== id || c.completed) return c;
    const progress = Math.min(c.progress + 1, c.target);
    const completed = progress >= c.target;
    if (completed) bonus = c.points;
    return { ...c, progress, completed };
  });
  return { challenges: next, bonus };
}

/** Saldo novo, convertendo em crédito como o servidor (CPF + teto do mês). */
function withBalance(points: ApiCarePointsSummary, delta: number): ApiCarePointsSummary {
  let balance = Math.max(points.balance + delta, 0);
  let monthRewardCents = points.monthRewardCents;
  if (points.canRedeem !== false) {
    while (balance >= points.pointsPerReward && monthRewardCents + points.rewardCents <= points.monthCapCents) {
      balance -= points.pointsPerReward;
      monthRewardCents += points.rewardCents;
    }
  }
  return { ...points, balance, monthRewardCents, todayPoints: Math.max(points.todayPoints + delta, 0) };
}

/**
 * Aplica uma ação no dashboard do Home. Pura. Devolve o dashboard novo e
 * quantos pontos a ação valeu (pra quem quiser mostrar "+2").
 */
export function applyCareAction(
  dashboard: ApiHomeDashboard,
  action: CareAction
): { dashboard: ApiHomeDashboard; delta: number; routineDelta: number } {
  const points = dashboard.carePoints;
  // Servidor antigo (sem os limites usados): não dá pra prever — espera a busca.
  if (!points || points.routinePointsToday == null) return { dashboard, delta: 0, routineDelta: 0 };

  let next: ApiCarePointsSummary = { ...points };
  let challenges = dashboard.weeklyChallenges;
  let rotina = dashboard.rotina;
  let delta = 0;
  let earnedByCheck = 0;

  if (action.kind === "check") {
    const base = action.isDose ? LOCAL_POINTS.DOSE : LOCAL_POINTS.ROTINA;
    const routineDelta = action.eligible
      ? Math.max(Math.min(base, LOCAL_POINTS.DAILY_ROUTINE_CAP - (next.routinePointsToday ?? 0)), 0)
      : 0;
    delta = routineDelta;
    if (!next.caredToday) {
      const bumped = bumpChallenge(challenges, "cuidado5");
      challenges = bumped.challenges;
      delta += bumped.bonus;
    }
    earnedByCheck = routineDelta;
    next = { ...next, routinePointsToday: (next.routinePointsToday ?? 0) + routineDelta, caredToday: true };
    if (action.scheduledToday && rotina) rotina = { ...rotina, doneToday: Math.min(rotina.doneToday + 1, rotina.totalToday) };
  } else if (action.kind === "uncheck") {
    delta = -action.earned;
    next = { ...next, routinePointsToday: Math.max((next.routinePointsToday ?? 0) - action.earned, 0) };
    if (action.scheduledToday && rotina) rotina = { ...rotina, doneToday: Math.max(rotina.doneToday - 1, 0) };
  } else if (action.kind === "medicao") {
    if (!next.measuredToday) {
      const paid = (next.measurementDaysThisWeek ?? 0) < LOCAL_POINTS.WEEKLY_MEASUREMENT_DAYS;
      delta = paid ? LOCAL_POINTS.MEDICAO : 0;
      const bumped = bumpChallenge(challenges, "medicao3");
      challenges = bumped.challenges;
      delta += bumped.bonus;
      next = {
        ...next,
        measuredToday: true,
        measurementDaysThisWeek: (next.measurementDaysThisWeek ?? 0) + (paid ? 1 : 0),
      };
    }
  } else {
    delta = next.readingPaidToday ? 0 : LOCAL_POINTS.LEITURA;
    const bumped = bumpChallenge(challenges, "leitura4");
    challenges = bumped.challenges;
    delta += bumped.bonus;
    next = { ...next, readingPaidToday: true };
  }

  return {
    dashboard: { ...dashboard, carePoints: withBalance(next, delta), weeklyChallenges: challenges, rotina },
    delta,
    // o que a marcação em si ganhou (sem bônus de desafio) — é o que volta ao desmarcar
    routineDelta: earnedByCheck,
  };
}

/**
 * Ação feita fora do Home (Rotina, Saúde, leitura): atualiza o Home
 * guardado em memória e marca pra conferir com o servidor quando ele
 * voltar a aparecer — a tela já mostra o valor novo, sem esperar.
 */
export function patchHomeCache(action: CareAction): { delta: number; routineDelta: number | null } {
  const cached = getCached<ApiHomeDashboard>(HOME_CACHE_KEY);
  markStale(HOME_CACHE_KEY);
  // sem Home guardado não dá pra prever (null = não sei quanto ganhou)
  if (!cached?.carePoints || cached.carePoints.routinePointsToday == null) return { delta: 0, routineDelta: null };
  const { dashboard, delta, routineDelta } = applyCareAction(cached, action);
  setCached(HOME_CACHE_KEY, dashboard);
  return { delta, routineDelta };
}
