import type { BearTier } from "@/constants/petStages";

/**
 * Bichinho do Home: cresce com a sequência de dias seguidos cuidando de
 * si (qualquer cuidado marcado no dia — ver getOverallRoutineStreak). Mais
 * curto que a escada de conquista de ROTINA (30/60/90/120 dias): aqui a
 * ideia é mostrar evolução já na primeira semana.
 */
export const CARE_PET_STAGES: { minDays: number; tier: BearTier }[] = [
  { minDays: 0, tier: { scale: 0.7, label: "Sonolento", badge: "😴", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: null } },
  { minDays: 1, tier: { scale: 0.78, label: "Filhote", badge: "🌱", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: "hearts" } },
  { minDays: 3, tier: { scale: 0.86, label: "Crescendo", badge: "✨", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: "stars" } },
  { minDays: 7, tier: { scale: 0.94, label: "Em forma", badge: "🏆", crown: false, trophyCount: 1, medal: "none", ribbon: null, sparkle: null } },
  { minDays: 14, tier: { scale: 1.0, label: "Destaque", badge: "👑", crown: true, trophyCount: 1, medal: "none", ribbon: null, sparkle: null } },
  { minDays: 30, tier: { scale: 1.06, label: "Medalhista", badge: "🥉", crown: true, trophyCount: 1, medal: "bronze", ribbon: null, sparkle: null } },
  { minDays: 60, tier: { scale: 1.12, label: "Campeão", badge: "🥇", crown: true, trophyCount: 2, medal: "gold", ribbon: "CAMPEÃO", sparkle: null } },
  { minDays: 90, tier: { scale: 1.18, label: "Supremo", badge: "💎", crown: true, trophyCount: 2, medal: "gold", ribbon: "SUPREMO", sparkle: null } },
];

/** Fase atual e a próxima (null na última) pra uma sequência de dias. */
export function carePetStage(streakDays: number): {
  tier: BearTier;
  next: { label: string; daysLeft: number } | null;
} {
  const days = Math.max(streakDays, 0);
  let index = 0;
  for (let i = 0; i < CARE_PET_STAGES.length; i++) {
    if (days >= CARE_PET_STAGES[i].minDays) index = i;
  }
  const nextStage = CARE_PET_STAGES[index + 1];
  return {
    tier: CARE_PET_STAGES[index].tier,
    next: nextStage ? { label: nextStage.tier.label, daysLeft: nextStage.minDays - days } : null,
  };
}
