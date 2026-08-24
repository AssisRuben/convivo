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
};

export type MedicationTrackingView = {
  id: string;
  productName: string;
  codigoProduto: number | null;
  purchaseDate: string;
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  /** Doses já tomadas desde a compra — soma as conclusões de todos os
   * horários ligados a essa ficha. */
  dosesTaken: number;
  estimatedRunOutDate: string;
  daysUntilRunOut: number;
};

function validateInput(input: MedicationTrackingInput): void {
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
    const horarios = tracking.checklistItems
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
      dosesTaken,
      estimatedRunOutDate: runOutDate.toISOString().slice(0, 10),
      daysUntilRunOut: daysBetween(today, runOutDate),
    };
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
