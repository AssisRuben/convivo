import { zonedParts } from "@/lib/timeZone";

/**
 * "Hoje" no fuso do celular de quem fez a requisição (ver lib/timeZone.ts),
 * como meia-noite UTC daquele dia — o formato que as colunas @db.Date
 * guardam. Antes usava o dia UTC, e no Brasil a Rotina virava às 21h.
 */
export function todayDate(): Date {
  const { year, month, day } = zonedParts(new Date());
  return new Date(Date.UTC(year, month - 1, day));
}

export function todayDateString(): string {
  return todayDate().toISOString().slice(0, 10);
}

export function formatDateLabel(date: Date): string {
  const today = todayDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (target.getTime() === today.getTime()) return "Hoje";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
