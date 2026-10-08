import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { currentTimeZone, getRequestContextStorage, zonedParts } from "@/lib/timeZone";
import { todayDate } from "@/lib/timeline/format";
import { daysBetween, medicationStart } from "@/lib/medications/medicationCore";
import { countScheduledDays, trackingDaysOfWeek } from "@/lib/medications/doseSchedule";
import type { HealthMeasurementType } from "@/lib/generated/prisma/client";

/**
 * Relatório mensal pro médico: o que o paciente registrou no app num mês
 * (adesão aos remédios, medições, dias com a rotina cumprida), como página
 * web pronta pra imprimir/salvar em PDF. Compartilhado por link com token
 * aleatório que expira em SHARE_DAYS — sem módulo nativo nem lib de PDF.
 */
const SHARE_DAYS = 7;
const MAX_MONTHS_BACK = 12;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TYPE_LABEL: Record<HealthMeasurementType, string> = {
  PRESSAO: "Pressão arterial",
  GLICEMIA: "Glicemia",
  PESO: "Peso",
  GORDURA: "Gordura corporal",
};

export type ReportData = {
  patientName: string;
  monthLabel: string;
  periodLabel: string;
  medications: { name: string; horarios: string[]; taken: number; expected: number }[];
  measurements: { type: HealthMeasurementType; label: string; rows: { date: string; value: string }[]; summary: string | null }[];
  routineDays: number;
  periodDays: number;
  generatedAt: string;
};

/**
 * Primeiro e último dia do mês ("YYYY-MM"), com o fim cortado em hoje
 * quando é o mês atual. Datas como meia-noite UTC do dia (formato das
 * colunas @db.Date). null = mês inválido ou no futuro. Pura.
 */
export function monthBounds(month: string, today: Date): { start: Date; end: Date } | null {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(year, m - 1, 1));
  if (start.getTime() > today.getTime()) return null;
  const monthEnd = new Date(Date.UTC(year, m, 0));
  return { start, end: monthEnd.getTime() < today.getTime() ? monthEnd : today };
}

function dayLabel(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

type MeasurementRow = {
  type: HealthMeasurementType;
  measuredAt: Date;
  pressaoSistolica: number | null;
  pressaoDiastolica: number | null;
  pesoKg: number | null;
  percentualGordura: number | null;
  glicemiaMgDl: number | null;
};

function formatValue(m: MeasurementRow): string {
  if (m.type === "PRESSAO") return `${m.pressaoSistolica ?? "?"}/${m.pressaoDiastolica ?? "?"} mmHg`;
  if (m.type === "PESO") return `${m.pesoKg != null ? formatNumber(m.pesoKg) : "?"} kg`;
  if (m.type === "GORDURA") return `${m.percentualGordura != null ? formatNumber(m.percentualGordura) : "?"}%`;
  return `${m.glicemiaMgDl ?? "?"} mg/dL`;
}

/** Resumo de uma série de medições do mês (já em ordem de data). Pura. */
export function summarizeMeasurements(type: HealthMeasurementType, rows: MeasurementRow[]): string | null {
  if (rows.length === 0) return null;
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  if (type === "PRESSAO") {
    const sys = rows.map((r) => r.pressaoSistolica).filter((v): v is number => v != null);
    const dia = rows.map((r) => r.pressaoDiastolica).filter((v): v is number => v != null);
    if (sys.length === 0 || dia.length === 0) return null;
    return `Média ${Math.round(avg(sys))}/${Math.round(avg(dia))} mmHg · maior ${Math.max(...sys)}/${Math.max(...dia)} · menor ${Math.min(...sys)}/${Math.min(...dia)}`;
  }
  if (type === "GLICEMIA") {
    const g = rows.map((r) => r.glicemiaMgDl).filter((v): v is number => v != null);
    if (g.length === 0) return null;
    return `Média ${Math.round(avg(g))} mg/dL · maior ${Math.max(...g)} · menor ${Math.min(...g)}`;
  }
  const values = rows
    .map((r) => (type === "PESO" ? r.pesoKg : r.percentualGordura))
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  const unit = type === "PESO" ? " kg" : "%";
  if (values.length === 1) return `${formatNumber(values[0])}${unit}`;
  const diff = values[values.length - 1] - values[0];
  const sign = diff > 0 ? "+" : "";
  return `De ${formatNumber(values[0])}${unit} pra ${formatNumber(values[values.length - 1])}${unit} (${sign}${formatNumber(diff)}${unit} no mês)`;
}

export async function buildMonthlyReport(userId: string, month: string): Promise<ReportData | null> {
  const today = todayDate();
  const bounds = monthBounds(month, today);
  if (!bounds) return null;
  const { start, end } = bounds;
  const timeZone = currentTimeZone();

  const [user, trackings, measurements, completions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
    // Só os ativos: de remédio removido não se sabe quando parou, e a
    // adesão dele no mês ficaria enganosa.
    prisma.medicationTracking.findMany({
      where: { userId, active: true },
      include: {
        checklistItems: {
          include: { completions: { where: { date: { gte: start, lte: end } }, select: { date: true } } },
        },
      },
    }),
    prisma.healthMeasurement.findMany({
      where: { userId, measuredAt: { gte: new Date(start.getTime() - MS_PER_DAY), lt: new Date(end.getTime() + 2 * MS_PER_DAY) } },
      orderBy: { measuredAt: "asc" },
    }),
    prisma.careChecklistCompletion.findMany({
      where: { item: { userId }, date: { gte: start, lte: end } },
      select: { date: true },
    }),
  ]);

  const medications: ReportData["medications"] = [];
  for (const tracking of trackings) {
    const items = tracking.checklistItems.filter((i) => i.active);
    const dosesPerDay = Math.max(items.length, 1);
    const trackingStart = medicationStart(tracking);
    const from = trackingStart.getTime() > start.getTime() ? trackingStart : start;
    let to = end;
    if (tracking.treatmentDays != null) {
      const lastDay = new Date(trackingStart.getTime() + (tracking.treatmentDays - 1) * MS_PER_DAY);
      if (lastDay.getTime() < to.getTime()) to = lastDay;
    }
    // só os dias programados (remédio toda quinta: ~4 doses no mês)
    const days = countScheduledDays(from, to, trackingDaysOfWeek(items));
    const taken = tracking.checklistItems.reduce((sum, i) => sum + i.completions.length, 0);
    const expected = days * dosesPerDay;
    if (expected === 0) continue;
    medications.push({
      name: tracking.productName,
      horarios: items.map((i) => i.timeOfDay).filter((t): t is string => Boolean(t)).sort(),
      taken: Math.min(taken, expected),
      expected,
    });
  }

  // Medições no dia LOCAL de quem gerou (fuso guardado no link)
  const inMonth = measurements.filter((m) => {
    const p = zonedParts(m.measuredAt, timeZone);
    return `${p.year}-${String(p.month).padStart(2, "0")}` === month;
  });
  const types: HealthMeasurementType[] = ["PRESSAO", "GLICEMIA", "PESO", "GORDURA"];
  const measurementGroups = types
    .map((type) => {
      const rows = inMonth.filter((m) => m.type === type);
      return {
        type,
        label: TYPE_LABEL[type],
        rows: rows.map((m) => {
          const p = zonedParts(m.measuredAt, timeZone);
          return {
            date: `${String(p.day).padStart(2, "0")}/${String(p.month).padStart(2, "0")} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`,
            value: formatValue(m),
          };
        }),
        summary: summarizeMeasurements(type, rows),
      };
    })
    .filter((g) => g.rows.length > 0);

  const routineDays = new Set(completions.map((c) => c.date.toISOString().slice(0, 10))).size;
  const [year, m] = month.split("-").map(Number);
  const now = zonedParts(new Date(), timeZone);

  return {
    patientName: user.name,
    monthLabel: `${MONTHS_PT[m - 1]} de ${year}`,
    periodLabel: `${dayLabel(start)} a ${dayLabel(end)}/${year}`,
    medications,
    measurements: measurementGroups,
    routineDays,
    periodDays: daysBetween(start, end) + 1,
    generatedAt: `${String(now.day).padStart(2, "0")}/${String(now.month).padStart(2, "0")}/${now.year} ${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Página do relatório (HTML com CSS de impressão). Pura. */
export function renderReportHtml(data: ReportData): string {
  const e = escapeHtml;
  const medRows = data.medications
    .map((med) => {
      const pct = med.expected > 0 ? Math.round((100 * med.taken) / med.expected) : 0;
      const color = pct >= 80 ? "#0f766e" : pct >= 50 ? "#b45309" : "#b91c1c";
      return `<tr><td>${e(med.name)}</td><td>${e(med.horarios.join(", ") || "—")}</td><td>${med.taken} de ${med.expected}</td><td style="color:${color};font-weight:700">${pct}%</td></tr>`;
    })
    .join("");
  const medSection = data.medications.length
    ? `<table><thead><tr><th>Medicamento</th><th>Horários</th><th>Doses tomadas</th><th>Adesão</th></tr></thead><tbody>${medRows}</tbody></table>`
    : `<p class="muted">Nenhum medicamento acompanhado no app neste mês.</p>`;

  const measureSection = data.measurements.length
    ? data.measurements
        .map(
          (g) =>
            `<h3>${e(g.label)}</h3>${g.summary ? `<p class="summary">${e(g.summary)}</p>` : ""}<table><thead><tr><th>Data</th><th>Valor</th></tr></thead><tbody>${g.rows
              .map((r) => `<tr><td>${e(r.date)}</td><td>${e(r.value)}</td></tr>`)
              .join("")}</tbody></table>`
        )
        .join("")
    : `<p class="muted">Nenhuma medição registrada neste mês.</p>`;

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Relatório de saúde — ${e(data.monthLabel)}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0b1e3d;max-width:760px;margin:0 auto;padding:24px;line-height:1.45}
  header{border-bottom:3px solid #0b1e3d;padding-bottom:12px;margin-bottom:16px}
  h1{font-size:22px;margin:0} h2{font-size:17px;margin:24px 0 8px} h3{font-size:15px;margin:16px 0 4px}
  .muted{color:#64748b} .summary{margin:2px 0 6px;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0} th{background:#f1f5f9;font-weight:600}
  .box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}
  footer{margin-top:28px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px}
  .print{display:inline-block;margin-top:8px;padding:8px 14px;border-radius:999px;background:#0b1e3d;color:#fff;text-decoration:none;font-size:14px}
  @media print{.print{display:none} body{padding:0}}
</style></head><body>
<header>
  <h1>Relatório de saúde — ${e(data.monthLabel)}</h1>
  <div class="muted">Paciente: <strong>${e(data.patientName)}</strong> · Período: ${e(data.periodLabel)}</div>
  <a class="print" href="javascript:window.print()">Imprimir ou salvar em PDF</a>
</header>
<h2>Remédios</h2>${medSection}
<h2>Medições</h2>${measureSection}
<h2>Rotina de cuidados</h2>
<p class="box">Marcou pelo menos um cuidado em <strong>${data.routineDays}</strong> de ${data.periodDays} dias do período.</p>
<footer>Gerado pelo app Convivo em ${e(data.generatedAt)}, a partir do que o próprio paciente registrou. Não substitui avaliação médica. Link válido por ${SHARE_DAYS} dias.</footer>
</body></html>`;
}

/** Cria o link (token aleatório, 7 dias). Mês: "YYYY-MM", até 12 meses atrás. */
export async function createReportShare(userId: string, month: string): Promise<{ token: string; expiresAt: Date }> {
  const today = todayDate();
  const bounds = monthBounds(month, today);
  if (!bounds) throw new Error("Mês inválido");
  const oldest = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - MAX_MONTHS_BACK, 1));
  if (bounds.start.getTime() < oldest.getTime()) throw new Error("Escolha um dos últimos 12 meses");

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + SHARE_DAYS * MS_PER_DAY);
  await prisma.reportShare.create({ data: { userId, token, month, timeZone: currentTimeZone(), expiresAt } });
  return { token, expiresAt };
}

/** HTML do relatório pelo link; null se o link não existe ou expirou. */
export async function getReportHtmlByToken(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const share = await prisma.reportShare.findUnique({ where: { token } });
  if (!share || share.expiresAt.getTime() < Date.now()) return null;
  // datas e "hoje" no relógio de quem gerou, não do servidor/navegador do médico
  return getRequestContextStorage().run({ timeZone: share.timeZone }, async () => {
    const data = await buildMonthlyReport(share.userId, share.month);
    return data ? renderReportHtml(data) : null;
  });
}
