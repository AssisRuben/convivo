import { prisma } from "@/lib/prisma";
import { localClock } from "@/lib/reminders/dispatchCore";
import {
  estimateRunOutDate,
  daysBetween,
  monthlyDoseSummary,
  supplyCoversTreatment,
  treatmentProgress,
  medicationStart,
} from "@/lib/medications/medicationCore";
import { todayDate } from "@/lib/timeline/format";
import { getLoyaltyProgress } from "@/lib/loyalty/loyaltyCore";
import { getActivePromotions } from "@/lib/catalog/catalogDb";
import { getWisdomTopicsSummaryForUser } from "@/lib/wisdom/wisdomCore";
import { getFaithBooksSummaryForUser } from "@/lib/faith/faithCore";
import type { HealthMeasurementType } from "@/lib/generated/prisma/client";

export type HomeNextDose = {
  checklistItemId: string;
  title: string;
  timeOfDay: string;
  overdue: boolean;
};

/** Período da dose: tratamento com prazo ("Dia 5 de 7") ou uso contínuo
 * (soma do mês: "Outubro: 9 de 10 doses"). null = item de rotina sem
 * ficha de medicamento (não dá pra saber período). */
export type HomeDosePeriod =
  | { kind: "tratamento"; day: number; totalDays: number }
  | { kind: "continuo"; month: number; taken: number; expected: number };

export type HomeDose = {
  checklistItemId: string;
  title: string;
  /** "HH:mm"; null = item de rotina sem horário fixo. */
  timeOfDay: string | null;
  taken: boolean;
  overdue: boolean;
  period: HomeDosePeriod | null;
};

export type HomeRepurchaseItem = {
  medicationTrackingId: string;
  productName: string;
  codigoProduto: number | null;
  daysUntilRunOut: number;
};

export type HomeLoyaltySummary = {
  stampsFilled: number;
  stampsTotal: number;
  totalRewardCents: number;
};

export type HomeTrailSummary = {
  chaptersRead: number;
  totalChapters: number;
  bestStreak: number;
};

export type HomeRotinaSummary = {
  doneToday: number;
  totalToday: number;
};

export type HomeSaudeSummary = {
  type: HealthMeasurementType;
  measuredAt: string;
  daysAgo: number;
} | null;

export type HomeDashboardView = {
  /** Todas as doses de hoje (tomadas e pendentes), em ordem de horário. */
  todayDoses: HomeDose[];
  /** Mantido pra versões antigas do app, que só mostravam uma dose. */
  nextDose: HomeNextDose | null;
  repurchaseReady: HomeRepurchaseItem[];
  loyalty: HomeLoyaltySummary;
  activePromotionsCount: number;
  wisdom: HomeTrailSummary;
  faith: HomeTrailSummary;
  rotina: HomeRotinaSummary;
  saude: HomeSaudeSummary;
};

// Mesmo limiar de urgência que o alerta push de recompra usa (ver
// dispatchMedicationRepurchaseAlerts) — mas aqui é uma janela, não um
// disparo pontual: "pronto pra recompra" cobre os últimos 5 dias antes de
// acabar, não só o dia exato do aviso.
const REPURCHASE_READY_THRESHOLD_DAYS = 5;

function parseTimeOfDay(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Todas as doses de medicamento de hoje — itens de rotina categoria
 * MEDICACAO agendados pra hoje, tomados ou não (a Home marca/desmarca
 * direto, a mesma conclusão que a aba Rotina usa). Cada dose traz o
 * período: dia do tratamento ("5 de 7") ou, no uso contínuo, a soma do
 * mês. Tratamento que já passou do último dia não aparece.
 * Ordem: por horário; sem horário fixo vai pro fim.
 */
async function getTodayDoses(userId: string, now: Date): Promise<HomeDose[]> {
  const { minutes: nowMinutes, weekday } = localClock(now);
  const today = todayDate();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const items = await prisma.careChecklistItem.findMany({
    where: { userId, active: true, category: "MEDICACAO" },
    include: {
      // o mês inteiro (inclui hoje): status de hoje + soma do uso contínuo
      completions: { where: { date: { gte: monthStart } }, select: { date: true } },
      medicationTracking: {
        select: { id: true, purchaseDate: true, startDate: true, treatmentDays: true, active: true },
      },
    },
  });

  // Doses por dia e conclusões do mês de cada ficha — somando TODOS os
  // horários dela, não só o da linha.
  const porFicha = new Map<string, { dosesPerDay: number; dates: Date[] }>();
  for (const item of items) {
    if (!item.medicationTrackingId) continue;
    const acc = porFicha.get(item.medicationTrackingId) ?? { dosesPerDay: 0, dates: [] };
    acc.dosesPerDay += 1;
    acc.dates.push(...item.completions.map((c) => c.date));
    porFicha.set(item.medicationTrackingId, acc);
  }

  const doses: (HomeDose & { minutes: number | null })[] = [];
  for (const item of items) {
    if (item.daysOfWeek.length > 0 && !item.daysOfWeek.includes(weekday)) continue;

    let period: HomeDosePeriod | null = null;
    const tracking = item.medicationTracking;
    if (tracking) {
      if (!tracking.active) continue;
      const progress = treatmentProgress(medicationStart(tracking), tracking.treatmentDays, today);
      if (progress) {
        if (progress.ended || progress.day < 1) continue;
        period = { kind: "tratamento", day: progress.day, totalDays: progress.totalDays };
      } else {
        const ficha = porFicha.get(tracking.id)!;
        const resumo = monthlyDoseSummary(medicationStart(tracking), ficha.dosesPerDay, ficha.dates, today);
        period = {
          kind: "continuo",
          month: today.getUTCMonth() + 1,
          taken: resumo.taken,
          expected: resumo.expected,
        };
      }
    }

    const taken = item.completions.some((c) => c.date.getTime() === today.getTime());
    const minutes = item.timeOfDay ? parseTimeOfDay(item.timeOfDay) : null;
    doses.push({
      checklistItemId: item.id,
      title: item.title,
      timeOfDay: item.timeOfDay,
      taken,
      overdue: !taken && minutes != null && minutes < nowMinutes,
      period,
      minutes,
    });
  }

  return doses
    .sort(
      (a, b) =>
        (a.minutes ?? Number.MAX_SAFE_INTEGER) - (b.minutes ?? Number.MAX_SAFE_INTEGER) ||
        a.title.localeCompare(b.title, "pt-BR")
    )
    .map(({ minutes: _minutes, ...dose }) => dose);
}

/**
 * Formato antigo (uma dose só), pras versões do app que ainda não
 * mostram a lista: a pendente de horário mais próximo; se todas já
 * passaram, a mais antiga, como atrasada.
 */
function pickNextDose(doses: HomeDose[]): HomeNextDose | null {
  const pending = doses.filter((d) => !d.taken && d.timeOfDay);
  const chosen = pending.find((d) => !d.overdue) ?? pending[0];
  if (!chosen) return null;
  return {
    checklistItemId: chosen.checklistItemId,
    title: chosen.title,
    timeOfDay: chosen.timeOfDay!,
    overdue: chosen.overdue,
  };
}

async function getRepurchaseReady(userId: string): Promise<HomeRepurchaseItem[]> {
  const today = todayDate();
  const trackings = await prisma.medicationTracking.findMany({
    where: { userId, active: true },
    include: { checklistItems: { where: { active: true } } },
  });

  const ready: HomeRepurchaseItem[] = [];
  for (const tracking of trackings) {
    const dosesPerDay = Math.max(tracking.checklistItems.length, 1);
    const runOutDate = estimateRunOutDate(
      medicationStart(tracking),
      tracking.totalUnits,
      tracking.unitsPerDose,
      dosesPerDay
    );
    const daysUntilRunOut = daysBetween(today, runOutDate);
    if (daysUntilRunOut > REPURCHASE_READY_THRESHOLD_DAYS) continue;
    // tratamento com prazo que acaba antes do remédio (ou já acabou) não
    // precisa de recompra
    if (supplyCoversTreatment(medicationStart(tracking), tracking.treatmentDays, today, daysUntilRunOut)) {
      continue;
    }

    ready.push({
      medicationTrackingId: tracking.id,
      productName: tracking.productName,
      codigoProduto: tracking.codigoProduto,
      daysUntilRunOut,
    });
  }

  return ready.sort((a, b) => a.daysUntilRunOut - b.daysUntilRunOut);
}

// Mesmo cálculo do banner "resumo somado" dos hubs de Pílulas/Gotas
// (streak é por tópico/livro, não faz sentido somar dias de sequências
// diferentes, só destacar a melhor).
function summarizeTrail(items: { chaptersRead: number; totalChapters: number; streakDays: number }[]): HomeTrailSummary {
  return {
    chaptersRead: items.reduce((sum, i) => sum + i.chaptersRead, 0),
    totalChapters: items.reduce((sum, i) => sum + i.totalChapters, 0),
    bestStreak: Math.max(0, ...items.map((i) => i.streakDays)),
  };
}

/** "X de Y cuidados feitos hoje" — todas as categorias, não só medicamento. */
async function getRotinaSummary(userId: string, now: Date): Promise<HomeRotinaSummary> {
  const { weekday } = localClock(now);
  const today = todayDate();

  const items = await prisma.careChecklistItem.findMany({
    where: { userId, active: true },
    include: { completions: { where: { date: today }, select: { id: true } } },
  });

  const scheduledToday = items.filter(
    (item) => item.daysOfWeek.length === 0 || item.daysOfWeek.includes(weekday)
  );
  const doneToday = scheduledToday.filter((item) => item.completions.length > 0).length;

  return { doneToday, totalToday: scheduledToday.length };
}

/** Última medição de saúde registrada, pra mostrar "há quantos dias". */
async function getSaudeSummary(userId: string, now: Date): Promise<HomeSaudeSummary> {
  const last = await prisma.healthMeasurement.findFirst({
    where: { userId },
    orderBy: { measuredAt: "desc" },
    select: { type: true, measuredAt: true },
  });
  if (!last) return null;

  return {
    type: last.type,
    measuredAt: last.measuredAt.toISOString(),
    daysAgo: Math.max(0, daysBetween(last.measuredAt, now)),
  };
}

export async function getHomeDashboardForUser(userId: string, now: Date = new Date()): Promise<HomeDashboardView> {
  const [todayDoses, repurchaseReady, loyalty, promotions, wisdomTopics, faithBooks, rotina, saude] = await Promise.all([
    getTodayDoses(userId, now),
    getRepurchaseReady(userId),
    getLoyaltyProgress(userId),
    getActivePromotions(1),
    getWisdomTopicsSummaryForUser(userId),
    getFaithBooksSummaryForUser(userId),
    getRotinaSummary(userId, now),
    getSaudeSummary(userId, now),
  ]);

  return {
    todayDoses,
    nextDose: pickNextDose(todayDoses),
    repurchaseReady,
    loyalty: {
      stampsFilled: loyalty.stampsFilled,
      stampsTotal: loyalty.stampsTotal,
      totalRewardCents: loyalty.totalRewardCents,
    },
    // getActivePromotions(1) só pra saber "tem alguma?" sem carregar a
    // lista inteira aqui — a tela de Ofertas busca a lista completa à parte.
    activePromotionsCount: promotions.length,
    wisdom: summarizeTrail(wisdomTopics),
    faith: summarizeTrail(faithBooks),
    rotina,
    saude,
  };
}
