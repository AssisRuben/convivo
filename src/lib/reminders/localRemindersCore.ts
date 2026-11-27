import { routineReminderContent } from "@/lib/reminders/reminderText";

/**
 * Parte pura dos lembretes agendados no próprio celular (sem Expo, sem
 * React Native — testável). Toda data aqui é no relógio do APARELHO
 * (getDate/getHours locais): é o fuso em que a pessoa vive, e o motivo de
 * agendar no celular em vez de mandar push do servidor (que no cron só
 * conhece o horário de Brasília).
 */

export type ReminderItem = {
  id: string;
  title: string;
  timeOfDay: string | null;
  daysOfWeek: number[];
  completedToday: boolean;
  medicationTrackingId: string | null;
  /** Último dia do tratamento; undefined = servidor antigo (não sabe). */
  remindUntil?: string | null;
};

export type PlannedReminder = {
  /** `rotina_<itemId>_<AAAA-MM-DD>_<HHMM>` — horário no id: mudou a hora,
   * é outro agendamento (o antigo é cancelado). */
  id: string;
  itemId: string;
  dayKey: string;
  fireAt: Date;
  title: string;
  body: string;
};

export const LOCAL_REMINDER_PREFIX = "rotina_";
export const REMINDER_DAYS = 7;
// iOS guarda no máximo 64 notificações locais pendentes por app (as mais
// próximas); 4 de folga pros "Daqui 15 min" da etapa dos botões.
export const REMINDER_LIMIT = 60;
// Servidor antigo não manda o fim do tratamento: remédio só agenda até
// amanhã, pra não tocar dias depois de um antibiótico ter acabado.
const UNKNOWN_END_MAX_DAYS_AHEAD = 1;

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Os lembretes dos próximos `days` dias, em ordem de horário, no máximo
 * `limit`. Pula: item sem horário, dia fora da programação, horário que
 * já passou, depois do fim do tratamento, e o de hoje que já foi marcado
 * (`completedToday` só vale se a lista é de hoje — `itemsDayKey`).
 *
 * `coveredUntil`: último dia com TODOS os lembretes agendados — o
 * servidor não manda o push de reserva até lá. Se o limite cortou no meio
 * de um dia, conta só até a véspera dele (null = nem hoje inteiro coube).
 */
export function planReminders(
  items: ReminderItem[],
  now: Date,
  itemsDayKey: string,
  days: number = REMINDER_DAYS,
  limit: number = REMINDER_LIMIT
): { reminders: PlannedReminder[]; coveredUntil: string | null } {
  const todayKey = localDayKey(now);
  const listIsToday = itemsDayKey === todayKey;
  const all: PlannedReminder[] = [];

  for (let ahead = 0; ahead < days; ahead++) {
    const day = addDays(now, ahead);
    const dayKey = localDayKey(day);
    const weekday = day.getDay();

    for (const item of items) {
      if (!item.timeOfDay) continue;
      const match = /^(\d{2}):(\d{2})$/.exec(item.timeOfDay);
      if (!match) continue;
      if (item.daysOfWeek.length > 0 && !item.daysOfWeek.includes(weekday)) continue;
      if (item.remindUntil && dayKey > item.remindUntil) continue;
      if (item.remindUntil === undefined && item.medicationTrackingId && ahead > UNKNOWN_END_MAX_DAYS_AHEAD) continue;
      if (ahead === 0 && listIsToday && item.completedToday) continue;

      const fireAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(match[1]), Number(match[2]));
      if (fireAt.getTime() <= now.getTime()) continue;

      const content = routineReminderContent(item.title, item.timeOfDay);
      all.push({
        id: `${LOCAL_REMINDER_PREFIX}${item.id}_${dayKey}_${match[1]}${match[2]}`,
        itemId: item.id,
        dayKey,
        fireAt,
        ...content,
      });
    }
  }

  all.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime() || a.id.localeCompare(b.id));
  const reminders = all.slice(0, limit);

  let coveredUntil: string | null = localDayKey(addDays(now, days - 1));
  if (all.length > limit) {
    const firstDropped = all[limit];
    coveredUntil = firstDropped.dayKey === todayKey ? null : localDayKey(addDays(firstDropped.fireAt, -1));
  }
  return { reminders, coveredUntil };
}
