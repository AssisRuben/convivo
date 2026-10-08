/**
 * Remédio em dias da semana (ex.: Ozempic toda quinta). `daysOfWeek` no
 * mesmo formato da Rotina: 0 = domingo … 6 = sábado; vazio = todo dia.
 * Sem dependência (nem prisma) — usado no servidor e nos testes.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function isScheduledOn(daysOfWeek: number[], day: Date): boolean {
  return daysOfWeek.length === 0 || daysOfWeek.includes(day.getUTCDay());
}

/** Dias da semana do remédio = os do primeiro horário ativo (todos os
 * horários de uma ficha têm os mesmos dias). */
export function trackingDaysOfWeek(items: { daysOfWeek: number[]; active?: boolean }[]): number[] {
  const item = items.find((i) => i.active !== false);
  return item ? normalizeDaysOfWeek(item.daysOfWeek) : [];
}

/** Ordena, tira repetido; os 7 dias marcados = todo dia (vazio). */
export function normalizeDaysOfWeek(days: number[]): number[] {
  const unique = [...new Set(days)].sort((a, b) => a - b);
  return unique.length === 7 ? [] : unique;
}

export function validDaysOfWeek(days: unknown): days is number[] {
  return Array.isArray(days) && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

/** Quantos dias programados em [from, to] (inclusive nas duas pontas). */
export function countScheduledDays(from: Date, to: Date, daysOfWeek: number[]): number {
  const total = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;
  if (total <= 0) return 0;
  if (daysOfWeek.length === 0) return total;
  const weeks = Math.floor(total / 7);
  let count = weeks * daysOfWeek.length;
  for (let i = weeks * 7; i < total; i++) {
    if (isScheduledOn(daysOfWeek, new Date(from.getTime() + i * MS_PER_DAY))) count++;
  }
  return count;
}

/**
 * O dia em que acaba: o primeiro dia programado, a partir de `from`
 * (inclusive), que o estoque já não cobre. `coveredDays` = quantos dias
 * programados o estoque cobre. Todo dia: from + coveredDays.
 */
export function firstUncoveredDay(from: Date, coveredDays: number, daysOfWeek: number[]): Date {
  if (daysOfWeek.length === 0) return new Date(from.getTime() + coveredDays * MS_PER_DAY);
  const perWeek = daysOfWeek.length;
  // semanas inteiras de uma vez, o resto dia a dia
  const weeks = Math.floor(coveredDays / perWeek);
  let cursor = new Date(from.getTime() + weeks * 7 * MS_PER_DAY);
  let remaining = coveredDays - weeks * perWeek;
  for (;;) {
    if (isScheduledOn(daysOfWeek, cursor)) {
      if (remaining === 0) return cursor;
      remaining--;
    }
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
  }
}

const SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** "todo dia", "toda quinta", "seg, qua e sex". */
export function describeDaysOfWeek(daysOfWeek: number[]): string {
  const days = normalizeDaysOfWeek(daysOfWeek);
  if (days.length === 0) return "todo dia";
  if (days.length === 1) return `${days[0] === 0 || days[0] === 6 ? "todo" : "toda"} ${LONG[days[0]]}`;
  const names = days.map((d) => SHORT[d]);
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}
