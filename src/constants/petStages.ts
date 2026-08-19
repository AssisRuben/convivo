// Espelha o tamanho das escadas em GOAL_LADDERS (backend) — só o
// comprimento importa aqui, pra transformar o índice do degrau batido
// numa proporção de crescimento do bichinho (usada pra escalar a
// animação em PetAnimation).
export const LADDER_LENGTHS: Record<"PESO" | "ROTINA", number> = {
  PESO: 10,
  ROTINA: 4,
};

export function petProgressLabelFor(goalType: "PESO" | "ROTINA"): string {
  return goalType === "PESO" ? "Seu progresso total" : "Sua sequência de rotina";
}
