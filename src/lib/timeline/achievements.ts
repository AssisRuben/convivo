import { prisma } from "@/lib/prisma";
import type { GoalType, TimelineEventType } from "@/lib/generated/prisma/client";

function daysBefore(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Degraus da meta — quando um novo é cruzado, vira uma postagem em "Minhas
// postagens" e o bichinho daquela meta evolui um estágio. PRESSAO é a
// única decrescente (sistólica mais baixa = degrau mais difícil) — o
// resto do mecanismo (recordMilestone, unique constraint) não precisa
// saber disso, só quem decide quando um degrau foi cruzado (ver
// checkPressureMilestones abaixo, que percorre a lista na ordem dela).
export const GOAL_LADDERS: Record<GoalType, number[]> = {
  PESO: [2, 5, 8, 10, 12, 15, 18, 20, 25, 30],
  ROTINA: [30, 60, 90, 120],
  INDICACAO: [1, 3, 5, 10, 20],
  PRESSAO: [140, 130, 120, 110],
};

const MILESTONE_EVENT_TYPE: Record<GoalType, TimelineEventType> = {
  PESO: "ACHIEVEMENT_WEIGHT_MILESTONE",
  ROTINA: "ACHIEVEMENT_ROUTINE_STREAK",
  INDICACAO: "ACHIEVEMENT_REFERRAL_MILESTONE",
  PRESSAO: "ACHIEVEMENT_PRESSURE",
};

/**
 * Cria uma conquista de degrau (peso/rotina) se ainda não existir uma pra
 * esse usuário+meta+degrau — idempotente, então pode ser chamada de novo
 * sem gerar postagem duplicada.
 */
async function recordMilestone(
  userId: string,
  goalType: GoalType,
  threshold: number,
  title: string,
  message: string,
  occurredAt: Date
): Promise<boolean> {
  const ladder = GOAL_LADDERS[goalType];
  const stage = ladder.indexOf(threshold);

  try {
    await prisma.timelineEvent.create({
      data: {
        userId,
        type: MILESTONE_EVENT_TYPE[goalType],
        title,
        message,
        occurredAt,
        goalType,
        milestoneValue: threshold,
        stage,
      },
    });
    return true;
  } catch (error) {
    // Unique constraint (userId, goalType, milestoneValue) — degrau já
    // batido antes, ignora silenciosamente.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Perda de peso acumulada desde a primeira pesagem registrada até a mais
 * recente — dispara uma postagem pra cada degrau da escada cruzado desde
 * a última checagem (pode ser mais de um, se a pessoa demorou pra
 * registrar).
 */
export async function checkWeightMilestones(userId: string): Promise<void> {
  const [first, latest] = await Promise.all([
    prisma.healthMeasurement.findFirst({
      where: { userId, type: "PESO", pesoKg: { not: null } },
      orderBy: { measuredAt: "asc" },
    }),
    prisma.healthMeasurement.findFirst({
      where: { userId, type: "PESO", pesoKg: { not: null } },
      orderBy: { measuredAt: "desc" },
    }),
  ]);
  if (!first || !latest || first.id === latest.id) return;
  if (first.pesoKg == null || latest.pesoKg == null) return;

  const lost = first.pesoKg - latest.pesoKg;
  if (lost <= 0) return;

  for (const threshold of GOAL_LADDERS.PESO) {
    if (lost < threshold) break;
    await recordMilestone(
      userId,
      "PESO",
      threshold,
      `-${threshold}kg! 🎉`,
      `Você já perdeu ${threshold}kg desde que começou a registrar seu peso. Seu bichinho está crescendo!`,
      latest.measuredAt
    );
  }
}

/**
 * Dias seguidos (até hoje) em que todo item ativo da rotina foi
 * concluído — olha pra trás dia a dia até achar uma falha, com um teto
 * (maior degrau + folga) pra não escanear o histórico inteiro à toa.
 */
async function currentRoutineStreak(userId: string, date: Date): Promise<number> {
  const activeItems = await prisma.careChecklistItem.findMany({
    where: { userId, active: true },
    select: { id: true },
  });
  if (activeItems.length === 0) return 0;
  const activeIds = activeItems.map((i) => i.id);

  const maxLookback = Math.max(...GOAL_LADDERS.ROTINA) + 5;
  let streak = 0;

  for (let i = 0; i < maxLookback; i++) {
    const day = startOfDay(daysBefore(date, i));
    const completions = await prisma.careChecklistCompletion.count({
      where: { date: day, itemId: { in: activeIds } },
    });
    if (completions < activeIds.length) break;
    streak += 1;
  }

  return streak;
}

/**
 * Checa a sequência de dias completos da rotina contra a escada (30/60/
 * 90/120 dias) e dispara a postagem do degrau mais alto ainda não
 * registrado.
 */
export async function checkRoutineStreakMilestones(userId: string, date: Date): Promise<void> {
  const streak = await currentRoutineStreak(userId, date);
  if (streak === 0) return;

  for (const threshold of GOAL_LADDERS.ROTINA) {
    if (streak < threshold) break;
    await recordMilestone(
      userId,
      "ROTINA",
      threshold,
      `${threshold} dias seguidos! 🔥`,
      `Você completou sua rotina de cuidados por ${threshold} dias seguidos. Seu bichinho está crescendo!`,
      date
    );
  }
}

/**
 * Checa o total de amigos indicados contra a escada (1/3/5/10/20) e
 * dispara a postagem do degrau mais alto ainda não registrado — chamada
 * depois que um indicado se cadastra com sucesso.
 */
export async function checkReferralMilestones(userId: string): Promise<void> {
  const referralCount = await prisma.user.count({ where: { referredById: userId } });
  if (referralCount === 0) return;

  for (const threshold of GOAL_LADDERS.INDICACAO) {
    if (referralCount < threshold) break;
    const friendWord = threshold === 1 ? "amigo indicado" : "amigos indicados";
    await recordMilestone(
      userId,
      "INDICACAO",
      threshold,
      `${threshold} ${friendWord}! 🎉`,
      `Você já tem ${threshold} ${friendWord} usando o Convivo. Seu bichinho está crescendo!`,
      new Date()
    );
  }
}

/**
 * Escada de pressão, controlada só pela sistólica (a mais alta) — mesmo
 * mecanismo de degrau único-por-usuário do peso/rotina/indicação, mas
 * decrescente: 140 é o degrau mais fácil, 110 o mais difícil. Olha
 * sempre a medição mais recente (não uma média nem "sustentado por N
 * dias" — o pedido foi simples: se a sistólica de agora já está dentro
 * da faixa do degrau, ele foi cruzado) e registra todo degrau já
 * alcançado que ainda não tinha sido batido antes.
 */
export async function checkPressureMilestones(userId: string): Promise<void> {
  const latest = await prisma.healthMeasurement.findFirst({
    where: { userId, type: "PRESSAO", pressaoSistolica: { not: null } },
    orderBy: { measuredAt: "desc" },
  });
  if (!latest || latest.pressaoSistolica == null) return;

  for (const threshold of GOAL_LADDERS.PRESSAO) {
    if (latest.pressaoSistolica > threshold) break;
    await recordMilestone(
      userId,
      "PRESSAO",
      threshold,
      `Pressão ${threshold} 🎉`,
      `Sua pressão sistólica chegou a ${latest.pressaoSistolica}, dentro da faixa de ${threshold}. Seu bichinho está evoluindo!`,
      latest.measuredAt
    );
  }
}

/**
 * Mesma lógica da pressão, pra glicemia.
 */
export async function checkGlicemiaAchievement(userId: string): Promise<void> {
  const measurements = await prisma.healthMeasurement.findMany({
    where: { userId, type: "GLICEMIA", glicemiaMgDl: { not: null } },
    orderBy: { measuredAt: "desc" },
    take: 20,
  });
  if (measurements.length < 2) return;

  const latest = measurements[0];
  const weekAgoTarget = daysBefore(latest.measuredAt, 7);
  const candidate = measurements.slice(1).find((m) => m.measuredAt <= weekAgoTarget);
  if (!candidate || candidate.glicemiaMgDl == null || latest.glicemiaMgDl == null) return;
  if (latest.glicemiaMgDl >= candidate.glicemiaMgDl) return;

  const recent = await prisma.timelineEvent.findFirst({
    where: { userId, type: "ACHIEVEMENT_GLICEMIA", occurredAt: { gte: weekAgoTarget } },
  });
  if (recent) return;

  await prisma.timelineEvent.create({
    data: {
      userId,
      type: "ACHIEVEMENT_GLICEMIA",
      title: "Glicemia melhorando 🎉",
      message: `Sua glicemia foi de ${candidate.glicemiaMgDl} para ${latest.glicemiaMgDl} mg/dL.`,
      occurredAt: latest.measuredAt,
    },
  });
}

/**
 * Se todo item ativo da checklist do usuário tem uma conclusão pra `date`,
 * registra a conquista do dia completo (uma vez por dia).
 */
export async function checkCareCompletionAchievement(
  userId: string,
  date: Date
): Promise<void> {
  const day = startOfDay(date);
  const nextDay = daysBefore(day, -1);

  const activeItems = await prisma.careChecklistItem.findMany({
    where: { userId, active: true },
    select: { id: true },
  });
  if (activeItems.length === 0) return;

  const completions = await prisma.careChecklistCompletion.count({
    where: { date: day, itemId: { in: activeItems.map((i) => i.id) } },
  });
  if (completions < activeItems.length) return;

  const alreadyRecorded = await prisma.timelineEvent.findFirst({
    where: {
      userId,
      type: "ACHIEVEMENT_CARE_COMPLETE",
      occurredAt: { gte: day, lt: nextDay },
    },
  });
  if (alreadyRecorded) return;

  await prisma.timelineEvent.create({
    data: {
      userId,
      type: "ACHIEVEMENT_CARE_COMPLETE",
      title: "Dia completo! ✅",
      message: "Você concluiu todos os seus cuidados de hoje.",
      occurredAt: date,
    },
  });
}
