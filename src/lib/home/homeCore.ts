import { prisma } from "@/lib/prisma";
import { brasiliaClock } from "@/lib/reminders/dispatchCore";
import { estimateRunOutDate, daysBetween } from "@/lib/medications/medicationCore";
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
 * Próxima dose de medicamento hoje: entre os itens de checklist categoria
 * MEDICACAO agendados pra hoje e ainda não marcados, pega o de horário
 * mais próximo — se todos já passaram do horário, mostra o mais antigo
 * como atrasado em vez de esconder (a pessoa ainda precisa saber que
 * ficou pra trás).
 */
async function getNextDose(userId: string, now: Date): Promise<HomeNextDose | null> {
  const { minutes: nowMinutes, weekday } = brasiliaClock(now);
  const today = todayDate();

  const items = await prisma.careChecklistItem.findMany({
    where: { userId, active: true, category: "MEDICACAO", timeOfDay: { not: null } },
    include: { completions: { where: { date: today }, select: { id: true } } },
  });

  const pending = items.filter((item) => {
    if (item.completions.length > 0) return false;
    if (item.daysOfWeek.length > 0 && !item.daysOfWeek.includes(weekday)) return false;
    return true;
  });
  if (pending.length === 0) return null;

  const withMinutes = pending.map((item) => ({
    item,
    minutes: parseTimeOfDay(item.timeOfDay!),
  }));

  const upcoming = withMinutes
    .filter((x) => x.minutes >= nowMinutes)
    .sort((a, b) => a.minutes - b.minutes)[0];
  const chosen = upcoming ?? withMinutes.sort((a, b) => a.minutes - b.minutes)[0];

  return {
    checklistItemId: chosen.item.id,
    title: chosen.item.title,
    timeOfDay: chosen.item.timeOfDay!,
    overdue: chosen.minutes < nowMinutes,
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
      tracking.purchaseDate,
      tracking.totalUnits,
      tracking.unitsPerDose,
      dosesPerDay
    );
    const daysUntilRunOut = daysBetween(today, runOutDate);
    if (daysUntilRunOut > REPURCHASE_READY_THRESHOLD_DAYS) continue;

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
  const { weekday } = brasiliaClock(now);
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
  const [nextDose, repurchaseReady, loyalty, promotions, wisdomTopics, faithBooks, rotina, saude] = await Promise.all([
    getNextDose(userId, now),
    getRepurchaseReady(userId),
    getLoyaltyProgress(userId),
    getActivePromotions(1),
    getWisdomTopicsSummaryForUser(userId),
    getFaithBooksSummaryForUser(userId),
    getRotinaSummary(userId, now),
    getSaudeSummary(userId, now),
  ]);

  return {
    nextDose,
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
