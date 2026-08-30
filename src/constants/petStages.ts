import type { ImageSourcePropType } from "react-native";

export type PetGoalType = "PESO" | "ROTINA" | "INDICACAO" | "PRESSAO";

// Uma foto ilustrada por degrau exato de cada escada (não por rótulo de
// fase — cada degrau tem a própria cena). Sem fotos pra ROTINA/INDICACAO
// ainda, esses continuam no emoji (ver PetAnimation.tsx). PRESSAO é
// escada decrescente (140→110, sistólica menor é o degrau mais difícil),
// diferente de PESO (crescente, kg perdido acumulado) — getPetPhoto não
// precisa saber disso, só faz o lookup direto pelo valor do degrau.
const PESO_PHOTOS: Record<number, ImageSourcePropType> = {
  2: require("../../assets/images/petStages/2kg.jpg"),
  5: require("../../assets/images/petStages/5kg.jpg"),
  8: require("../../assets/images/petStages/8kg.jpg"),
  10: require("../../assets/images/petStages/10kg.jpg"),
  12: require("../../assets/images/petStages/12kg.jpg"),
  15: require("../../assets/images/petStages/15kg.jpg"),
  18: require("../../assets/images/petStages/18kg.jpg"),
  20: require("../../assets/images/petStages/20kg.jpg"),
  25: require("../../assets/images/petStages/25kg.jpg"),
  30: require("../../assets/images/petStages/30kg.jpg"),
};

const PRESSAO_PHOTOS: Record<number, ImageSourcePropType> = {
  140: require("../../assets/images/petStages/140_90.jpg"),
  130: require("../../assets/images/petStages/130_80.jpg"),
  120: require("../../assets/images/petStages/120_70.jpg"),
  110: require("../../assets/images/petStages/110_60.jpg"),
};

export function getPetPhoto(
  goalType: PetGoalType,
  milestoneValue: number
): ImageSourcePropType | undefined {
  if (goalType === "PESO") return PESO_PHOTOS[milestoneValue];
  if (goalType === "PRESSAO") return PRESSAO_PHOTOS[milestoneValue];
  return undefined;
}

// Espelha o tamanho das escadas em GOAL_LADDERS (backend).
export const LADDER_LENGTHS: Record<PetGoalType, number> = {
  PESO: 10,
  ROTINA: 4,
  INDICACAO: 5,
  PRESSAO: 4,
};

export function petProgressLabelFor(goalType: PetGoalType): string {
  if (goalType === "PESO") return "Seu progresso total";
  if (goalType === "ROTINA") return "Sua sequência de rotina";
  if (goalType === "PRESSAO") return "Sua pressão sob controle";
  return "Seus amigos indicados";
}

export type BearTier = {
  scale: number;
  label: string;
  /** Emoji do badge de canto do card. */
  badge: string;
  crown: boolean;
  trophyCount: 0 | 1 | 2;
  medal: "none" | "bronze" | "gold";
  /** Faixa de destaque embaixo do bichinho (ex: "CAMPEÃO"). */
  ribbon: string | null;
  sparkle: "hearts" | "stars" | null;
};

// Uma entrada por degrau exato da escada — cada fase foi desenhada à mão
// (troféu, medalha, coroa vão se acumulando conforme o usuário avança),
// não é uma fórmula contínua.
const PESO_TIERS: Record<number, BearTier> = {
  2: { scale: 0.75, label: "Filhote", badge: "🌱", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: "hearts" },
  5: { scale: 0.85, label: "Crescendo", badge: "✨", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: "stars" },
  8: { scale: 0.95, label: "Em forma", badge: "🏆", crown: false, trophyCount: 1, medal: "none", ribbon: null, sparkle: null },
  10: { scale: 1.0, label: "Destaque", badge: "👑", crown: true, trophyCount: 1, medal: "none", ribbon: null, sparkle: null },
  12: { scale: 1.03, label: "Destaque", badge: "👑", crown: true, trophyCount: 1, medal: "none", ribbon: null, sparkle: null },
  15: { scale: 1.08, label: "Medalhista", badge: "🥉", crown: true, trophyCount: 1, medal: "bronze", ribbon: null, sparkle: null },
  18: { scale: 1.11, label: "Medalhista", badge: "🥉", crown: true, trophyCount: 1, medal: "bronze", ribbon: null, sparkle: null },
  20: { scale: 1.15, label: "Campeão", badge: "🥇", crown: true, trophyCount: 2, medal: "gold", ribbon: "CAMPEÃO", sparkle: null },
  25: { scale: 1.2, label: "Campeão", badge: "🥇", crown: true, trophyCount: 2, medal: "gold", ribbon: "CAMPEÃO", sparkle: null },
  30: { scale: 1.3, label: "Supremo", badge: "💎", crown: true, trophyCount: 2, medal: "gold", ribbon: "SUPREMO", sparkle: null },
};

const ROTINA_TIERS: Record<number, BearTier> = {
  30: { scale: 0.85, label: "Filhote", badge: "🌱", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: "hearts" },
  60: { scale: 1.0, label: "Em forma", badge: "🏆", crown: false, trophyCount: 1, medal: "none", ribbon: null, sparkle: null },
  90: { scale: 1.1, label: "Medalhista", badge: "🥉", crown: true, trophyCount: 1, medal: "bronze", ribbon: null, sparkle: null },
  120: { scale: 1.25, label: "Supremo", badge: "💎", crown: true, trophyCount: 2, medal: "gold", ribbon: "SUPREMO", sparkle: null },
};

const INDICACAO_TIERS: Record<number, BearTier> = {
  1: { scale: 0.8, label: "Filhote", badge: "🌱", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: "stars" },
  3: { scale: 0.95, label: "Em forma", badge: "🏆", crown: false, trophyCount: 1, medal: "none", ribbon: null, sparkle: null },
  5: { scale: 1.05, label: "Destaque", badge: "👑", crown: true, trophyCount: 1, medal: "none", ribbon: null, sparkle: null },
  10: { scale: 1.15, label: "Medalhista", badge: "🥉", crown: true, trophyCount: 1, medal: "bronze", ribbon: null, sparkle: null },
  20: { scale: 1.3, label: "Supremo", badge: "💎", crown: true, trophyCount: 2, medal: "gold", ribbon: "TOP INDICADOR", sparkle: null },
};

// Chaves em ordem decrescente de dificuldade crescente (140 = degrau mais
// fácil, 110 = mais difícil) — mesma forma de badge/coroa/medalha
// acumulando das outras escadas, só que o valor do degrau cai em vez de
// subir.
const PRESSAO_TIERS: Record<number, BearTier> = {
  140: { scale: 0.85, label: "Atenção", badge: "🌱", crown: false, trophyCount: 0, medal: "none", ribbon: null, sparkle: "hearts" },
  130: { scale: 0.95, label: "Melhorando", badge: "✨", crown: false, trophyCount: 1, medal: "none", ribbon: null, sparkle: "stars" },
  120: { scale: 1.08, label: "Quase lá", badge: "🥉", crown: true, trophyCount: 1, medal: "bronze", ribbon: null, sparkle: null },
  110: { scale: 1.2, label: "Sob controle", badge: "💎", crown: true, trophyCount: 2, medal: "gold", ribbon: "CONTROLADA", sparkle: null },
};

const TIER_TABLES: Record<PetGoalType, Record<number, BearTier>> = {
  PESO: PESO_TIERS,
  ROTINA: ROTINA_TIERS,
  INDICACAO: INDICACAO_TIERS,
  PRESSAO: PRESSAO_TIERS,
};

export function getBearTier(goalType: PetGoalType, milestoneValue: number): BearTier {
  const table = TIER_TABLES[goalType];
  if (table[milestoneValue]) return table[milestoneValue];

  // Fallback defensivo — não deve acontecer com a escada atual, mas evita
  // quebrar se um valor fora da tabela chegar aqui.
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  const match = keys.find((k) => k >= milestoneValue) ?? keys[keys.length - 1];
  return table[match];
}
