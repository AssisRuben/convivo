import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Fuso horário do CELULAR de quem fez a requisição — o app manda no header
 * `X-Timezone` (ver apiFetch em lib/api.ts) e o server.js guarda aqui
 * durante a requisição inteira, pra "hoje" (todayDate) e "agora"
 * (localClock) seguirem o relógio do aparelho: a Rotina vira à meia-noite
 * do celular, não à meia-noite UTC (que no Brasil é 21h).
 *
 * O store fica em globalThis porque o server.js e cada rota de API são
 * bundles separados — um `new AsyncLocalStorage()` por módulo não seria o
 * mesmo objeto nos dois lados.
 *
 * Sem header (cron dos lembretes, que não vem de um celular) cai no fuso
 * de Brasília.
 */
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

type RequestContext = { timeZone: string };

const globalForTz = globalThis as unknown as { __convivoRequestContext?: AsyncLocalStorage<RequestContext> };

export function getRequestContextStorage(): AsyncLocalStorage<RequestContext> {
  if (!globalForTz.__convivoRequestContext) {
    globalForTz.__convivoRequestContext = new AsyncLocalStorage<RequestContext>();
  }
  return globalForTz.__convivoRequestContext;
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(timeZone) || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function currentTimeZone(): string {
  return getRequestContextStorage().getStore()?.timeZone ?? DEFAULT_TIME_ZONE;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Data, hora e dia da semana de `date` no fuso informado. */
export function zonedParts(date: Date, timeZone: string = currentTimeZone()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: WEEKDAYS.indexOf(get("weekday")),
  };
}

/** Instante da meia-noite de hoje no relógio do celular da requisição. */
export function startOfLocalDay(now: Date = new Date()): Date {
  const { hour, minute } = zonedParts(now);
  const elapsedMs = ((hour * 60 + minute) * 60 + now.getUTCSeconds()) * 1000 + now.getUTCMilliseconds();
  return new Date(now.getTime() - elapsedMs);
}

/**
 * Semana atual (segunda a domingo) no relógio do celular: instante da
 * segunda 00:00 e a data dela ("2026-10-05"), pra chave de prêmio semanal.
 */
export function localWeekStart(now: Date = new Date()): { start: Date; key: string } {
  const { weekday } = zonedParts(now);
  const daysSinceMonday = (weekday + 6) % 7;
  const start = new Date(startOfLocalDay(now).getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  const { year, month, day } = zonedParts(new Date(start.getTime() + 12 * 60 * 60 * 1000));
  return { start, key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
}
