import { prisma } from "@/lib/prisma";
import { todayDate } from "@/lib/timeline/format";

const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

export type MedicationTrackingInput = {
  productName: string;
  codigoProduto?: number | null;
  purchaseDate: string; // "YYYY-MM-DD"
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[]; // ["08:00", "20:00", ...]
  /** Dias de tratamento; null/ausente = uso contínuo. */
  treatmentDays?: number | null;
};

const MAX_TREATMENT_DAYS = 365;

export type MedicationTrackingView = {
  id: string;
  productName: string;
  codigoProduto: number | null;
  purchaseDate: string;
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  /** null = uso contínuo. */
  treatmentDays: number | null;
  /** Doses já tomadas desde a compra — soma as conclusões de todos os
   * horários ligados a essa ficha. */
  dosesTaken: number;
  estimatedRunOutDate: string;
  daysUntilRunOut: number;
};

export function validateInput(input: MedicationTrackingInput): void {
  if (!input.productName.trim()) throw new Error("Nome do medicamento é obrigatório");
  if (!Number.isInteger(input.totalUnits) || input.totalUnits <= 0) {
    throw new Error("Quantidade total inválida");
  }
  if (!Number.isInteger(input.unitsPerDose) || input.unitsPerDose <= 0) {
    throw new Error("Unidades por dose inválidas");
  }
  if (input.horarios.length === 0) {
    throw new Error("Informe pelo menos um horário");
  }
  for (const horario of input.horarios) {
    if (!TIME_FORMAT.test(horario)) throw new Error(`Horário inválido: ${horario}`);
  }
  if (Number.isNaN(new Date(input.purchaseDate).getTime())) {
    throw new Error("Data da compra inválida");
  }
  if (input.treatmentDays != null) {
    if (
      !Number.isInteger(input.treatmentDays) ||
      input.treatmentDays <= 0 ||
      input.treatmentDays > MAX_TREATMENT_DAYS
    ) {
      throw new Error(`Duração do tratamento inválida (1 a ${MAX_TREATMENT_DAYS} dias)`);
    }
  }
}

/**
 * Em que dia do tratamento a pessoa está: dia 1 = dia da compra
 * (purchaseDate). `null` pra uso contínuo (treatmentDays null). `ended`
 * quando hoje já passou do último dia — quem consome esconde a dose /
 * para de lembrar.
 */
export function treatmentProgress(
  purchaseDate: Date,
  treatmentDays: number | null,
  today: Date
): { day: number; totalDays: number; ended: boolean } | null {
  if (treatmentDays == null) return null;
  const day = daysBetween(startOfDayUtc(purchaseDate), today) + 1;
  return { day, totalDays: treatmentDays, ended: day > treatmentDays };
}

/**
 * Soma do mês pro uso contínuo: doses tomadas x doses previstas, do dia 1
 * do mês (ou do dia da compra, se foi depois) até hoje, inclusive.
 * `completionDates` são as datas de conclusão de TODOS os horários da
 * ficha; datas fora da janela são ignoradas.
 */
export function monthlyDoseSummary(
  purchaseDate: Date,
  dosesPerDay: number,
  completionDates: Date[],
  today: Date
): { taken: number; expected: number; monthStart: Date } {
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const purchaseDay = startOfDayUtc(purchaseDate);
  const from = purchaseDay > monthStart ? purchaseDay : monthStart;
  const days = Math.max(daysBetween(from, today) + 1, 0);
  const taken = completionDates.filter((d) => d >= from && d <= today).length;
  return { taken, expected: days * Math.max(dosesPerDay, 1), monthStart };
}

/**
 * Tratamento com prazo que o estoque atual já cobre até o fim (ou que já
 * acabou) — não faz sentido sugerir/avisar recompra. Uso contínuo
 * (treatmentDays null) sempre devolve false.
 */
export function supplyCoversTreatment(
  purchaseDate: Date,
  treatmentDays: number | null,
  today: Date,
  daysUntilRunOut: number
): boolean {
  const progress = treatmentProgress(purchaseDate, treatmentDays, today);
  if (!progress) return false;
  const remainingDays = progress.totalDays - progress.day;
  return remainingDays <= Math.max(daysUntilRunOut, 0);
}

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Calcula em quantos dias o medicamento acaba a partir do consumo diário
 * esperado (unitsPerDose × doses por dia) — não desconta doses realmente
 * tomadas, é uma estimativa pela posologia cadastrada, igual o dia-a-dia
 * de "acabar a cartela" que a farmácia já espera do paciente.
 */
function estimateRunOutDate(
  purchaseDate: Date,
  totalUnits: number,
  unitsPerDose: number,
  dosesPerDay: number
): Date {
  const dailyConsumption = unitsPerDose * dosesPerDay;
  const daysSupply = dailyConsumption > 0 ? Math.floor(totalUnits / dailyConsumption) : 0;
  const runOut = new Date(purchaseDate);
  runOut.setDate(runOut.getDate() + daysSupply);
  return runOut;
}

function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export async function createMedicationTracking(
  userId: string,
  input: MedicationTrackingInput
): Promise<void> {
  validateInput(input);

  await prisma.$transaction(async (tx) => {
    const tracking = await tx.medicationTracking.create({
      data: {
        userId,
        productName: input.productName.trim(),
        codigoProduto: input.codigoProduto ?? null,
        purchaseDate: new Date(input.purchaseDate),
        totalUnits: input.totalUnits,
        unitsPerDose: input.unitsPerDose,
        treatmentDays: input.treatmentDays ?? null,
      },
    });

    for (const horario of input.horarios) {
      await tx.careChecklistItem.create({
        data: {
          userId,
          title: input.productName.trim(),
          category: "MEDICACAO",
          timeOfDay: horario,
          daysOfWeek: [],
          medicationTrackingId: tracking.id,
        },
      });
    }
  });
}

export async function listMedicationTrackingsForUser(
  userId: string
): Promise<MedicationTrackingView[]> {
  const trackings = await prisma.medicationTracking.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "desc" },
    include: { checklistItems: { include: { completions: true } } },
  });

  const today = todayDate();

  return trackings.map((tracking) => {
    // Só os horários ATIVOS (o que foi tirado na edição ou removido na
    // Rotina não conta mais); dosesTaken abaixo soma todos, inclusive os
    // inativos — é histórico do que já foi tomado.
    const horarios = tracking.checklistItems
      .filter((item) => item.active)
      .map((item) => item.timeOfDay)
      .filter((t): t is string => Boolean(t))
      .sort();
    const dosesPerDay = Math.max(horarios.length, 1);
    const dosesTaken = tracking.checklistItems.reduce(
      (sum, item) => sum + item.completions.length,
      0
    );
    const runOutDate = estimateRunOutDate(
      tracking.purchaseDate,
      tracking.totalUnits,
      tracking.unitsPerDose,
      dosesPerDay
    );

    return {
      id: tracking.id,
      productName: tracking.productName,
      codigoProduto: tracking.codigoProduto,
      purchaseDate: tracking.purchaseDate.toISOString().slice(0, 10),
      totalUnits: tracking.totalUnits,
      unitsPerDose: tracking.unitsPerDose,
      horarios,
      treatmentDays: tracking.treatmentDays,
      dosesTaken,
      estimatedRunOutDate: runOutDate.toISOString().slice(0, 10),
      daysUntilRunOut: daysBetween(today, runOutDate),
    };
  });
}

/** O que dá pra mudar numa ficha já cadastrada (nome e data da compra
 * vêm do histórico de compras e ficam como estão). */
export type MedicationTrackingUpdate = {
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  treatmentDays: number | null;
};

/**
 * Compara os horários atuais (itens ativos da Rotina) com os desejados:
 * horário que continua -> mantém o item (preserva "tomado hoje" e o
 * histórico); que saiu -> desativa; que entrou -> cria item novo.
 */
export function diffHorarios(
  atuais: { id: string; timeOfDay: string | null }[],
  desejados: string[]
): { manter: string[]; desativar: string[]; criar: string[] } {
  const desejadosSet = new Set(desejados);
  const manter: string[] = [];
  const desativar: string[] = [];
  const horariosMantidos = new Set<string>();
  for (const item of atuais) {
    // horário duplicado (dois itens no mesmo horário) — fica só um
    if (item.timeOfDay && desejadosSet.has(item.timeOfDay) && !horariosMantidos.has(item.timeOfDay)) {
      manter.push(item.id);
      horariosMantidos.add(item.timeOfDay);
    } else {
      desativar.push(item.id);
    }
  }
  const criar = [...desejadosSet].filter((h) => !horariosMantidos.has(h)).sort();
  return { manter, desativar, criar };
}

export async function updateMedicationTracking(
  userId: string,
  id: string,
  update: MedicationTrackingUpdate
): Promise<void> {
  const tracking = await prisma.medicationTracking.findUnique({
    where: { id },
    include: { checklistItems: { where: { active: true } } },
  });
  if (!tracking || tracking.userId !== userId || !tracking.active) {
    throw new Error("Sem permissão pra alterar esse medicamento");
  }

  const horarios = [...new Set(update.horarios)];
  validateInput({
    productName: tracking.productName,
    codigoProduto: tracking.codigoProduto,
    purchaseDate: tracking.purchaseDate.toISOString().slice(0, 10),
    totalUnits: update.totalUnits,
    unitsPerDose: update.unitsPerDose,
    horarios,
    treatmentDays: update.treatmentDays,
  });

  const { desativar, criar } = diffHorarios(tracking.checklistItems, horarios);

  await prisma.$transaction(async (tx) => {
    await tx.medicationTracking.update({
      where: { id },
      data: {
        totalUnits: update.totalUnits,
        unitsPerDose: update.unitsPerDose,
        treatmentDays: update.treatmentDays,
      },
    });
    if (desativar.length > 0) {
      await tx.careChecklistItem.updateMany({
        where: { id: { in: desativar } },
        data: { active: false },
      });
    }
    for (const horario of criar) {
      await tx.careChecklistItem.create({
        data: {
          userId,
          title: tracking.productName,
          category: "MEDICACAO",
          timeOfDay: horario,
          daysOfWeek: [],
          medicationTrackingId: id,
        },
      });
    }
  });
}

export async function deactivateMedicationTracking(userId: string, id: string): Promise<void> {
  const tracking = await prisma.medicationTracking.findUnique({ where: { id } });
  if (!tracking || tracking.userId !== userId) {
    throw new Error("Sem permissão pra alterar esse medicamento");
  }

  await prisma.$transaction([
    prisma.careChecklistItem.updateMany({
      where: { medicationTrackingId: id },
      data: { active: false },
    }),
    prisma.medicationTracking.update({ where: { id }, data: { active: false } }),
  ]);
}

// Exportados só pra reaproveitar o mesmo cálculo no disparo de lembrete
// (dispatchCore.ts), sem duplicar a fórmula.
export { estimateRunOutDate, daysBetween };
