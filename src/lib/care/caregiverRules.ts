/**
 * Regras puras do modo cuidador — sem dependências, pra o disparo de
 * lembretes (dispatchCore) usar sem importar caregiverCore (que importa a
 * Home, que importa o dispatchCore: ciclo).
 */
export const CODE_LENGTH = 6;

/** Minutos de atraso pra avisar o cuidador (decisão de negócio, 08/10/2026). */
export const MISSED_DOSE_ALERT_MINUTES = 30;
// Passou muito da hora (cron atrasado, servidor fora): não avisa mais tarde
// demais — vira ruído, não ajuda.
export const MISSED_DOSE_ALERT_WINDOW_MINUTES = 180;

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Hora de avisar o cuidador desta dose? Pura. Avisa uma vez, entre
 * MISSED_DOSE_ALERT_MINUTES e MISSED_DOSE_ALERT_WINDOW_MINUTES depois do
 * horário, se a dose está programada hoje e não foi marcada.
 */
export function shouldAlertMissedDose(params: {
  itemMinutes: number;
  nowMinutes: number;
  scheduledToday: boolean;
  completed: boolean;
  alreadyAlerted: boolean;
}): boolean {
  if (!params.scheduledToday || params.completed || params.alreadyAlerted) return false;
  const late = params.nowMinutes - params.itemMinutes;
  return late >= MISSED_DOSE_ALERT_MINUTES && late <= MISSED_DOSE_ALERT_WINDOW_MINUTES;
}
