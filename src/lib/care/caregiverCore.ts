import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTodayDoses, type HomeDose } from "@/lib/home/homeCore";
import { getOverallRoutineStreak } from "@/lib/care/checklistCore";
import type { HealthMeasurementType } from "@/lib/generated/prisma/client";
import { CODE_LENGTH, normalizeCode } from "@/lib/care/caregiverRules";

export { MISSED_DOSE_ALERT_MINUTES, normalizeCode, shouldAlertMissedDose } from "@/lib/care/caregiverRules";

/**
 * Modo cuidador. O titular (quem é acompanhado) gera o convite — o
 * consentimento parte dele —, o cuidador aceita com o código e passa a ver
 * as doses do dia, a sequência e as medições recentes, e a receber alerta
 * de dose não marcada (dispatchCaregiverMissedDoseAlerts). Qualquer um dos
 * dois desfaz o vínculo.
 */
const INVITE_DAYS = 7;
const MAX_CAREGIVERS = 5;
// Sem letras/números que se confundem (O/0, I/1/L) — o código é ditado e
// digitado por pessoas mais velhas.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/** Gera (ou renova) o convite do titular. Um convite aberto por vez. */
export async function createCareInvite(titularId: string): Promise<{ code: string; expiresAt: Date }> {
  const active = await prisma.careLink.count({ where: { titularId, status: "ACTIVE" } });
  if (active >= MAX_CAREGIVERS) throw new Error(`Você já tem ${MAX_CAREGIVERS} pessoas te acompanhando`);

  await prisma.careLink.updateMany({ where: { titularId, status: "PENDING" }, data: { status: "REVOKED" } });

  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await prisma.careLink.create({ data: { titularId, inviteCode: code, status: "PENDING", expiresAt } });
      return { code, expiresAt };
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error; // código repetido: tenta outro
    }
  }
  throw new Error("Não foi possível gerar o convite, tente de novo");
}

/** O cuidador aceita com o código. Devolve o nome de quem passa a acompanhar. */
export async function acceptCareInvite(caregiverId: string, rawCode: string): Promise<{ titularName: string }> {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) throw new Error("Código inválido — confira as 6 letras e números");

  const link = await prisma.careLink.findUnique({
    where: { inviteCode: code },
    include: { titular: { select: { name: true } } },
  });
  if (!link || link.status !== "PENDING" || !link.expiresAt || link.expiresAt.getTime() < Date.now()) {
    throw new Error("Convite inválido ou expirado — peça um código novo");
  }
  if (link.titularId === caregiverId) throw new Error("Esse convite é seu — mande pra quem vai te acompanhar");

  const already = await prisma.careLink.findFirst({
    where: { titularId: link.titularId, caregiverId, status: "ACTIVE" },
  });
  if (already) throw new Error(`Você já acompanha ${link.titular.name}`);

  await prisma.careLink.update({
    where: { id: link.id },
    // o código sai do convite aceito: não dá pra reaproveitar
    data: { caregiverId, status: "ACTIVE", acceptedAt: new Date(), inviteCode: `USADO-${link.id}` },
  });
  return { titularName: link.titular.name };
}

/** Titular ou cuidador desfaz o vínculo (ou o titular cancela o convite). */
export async function revokeCareLink(userId: string, linkId: string): Promise<void> {
  const link = await prisma.careLink.findUnique({ where: { id: linkId } });
  if (!link || (link.titularId !== userId && link.caregiverId !== userId)) {
    throw new Error("Vínculo não encontrado");
  }
  await prisma.careLink.update({ where: { id: linkId }, data: { status: "REVOKED" } });
}

export type CaredPerson = {
  linkId: string;
  name: string;
  doses: HomeDose[];
  streakDays: number;
  latest: { type: HealthMeasurementType; value: string; measuredAt: string }[];
};

export type CareOverview = {
  /** Quem me acompanha. */
  caregivers: { linkId: string; name: string; since: string }[];
  /** Convite aberto (titular), se houver. */
  pendingInvite: { linkId: string; code: string; expiresAt: string } | null;
  /** Quem eu acompanho. */
  people: CaredPerson[];
};

function formatMeasurement(m: {
  type: HealthMeasurementType;
  pressaoSistolica: number | null;
  pressaoDiastolica: number | null;
  pesoKg: number | null;
  percentualGordura: number | null;
  glicemiaMgDl: number | null;
}): string {
  if (m.type === "PRESSAO") return `${m.pressaoSistolica ?? "?"}/${m.pressaoDiastolica ?? "?"} mmHg`;
  if (m.type === "PESO") return `${m.pesoKg ?? "?"} kg`;
  if (m.type === "GORDURA") return `${m.percentualGordura ?? "?"}%`;
  return `${m.glicemiaMgDl ?? "?"} mg/dL`;
}

async function caredPerson(linkId: string, titularId: string, name: string, now: Date): Promise<CaredPerson> {
  const [doses, streakDays, measurements] = await Promise.all([
    getTodayDoses(titularId, now),
    getOverallRoutineStreak(titularId),
    prisma.healthMeasurement.findMany({
      where: { userId: titularId, type: { in: ["PRESSAO", "GLICEMIA"] } },
      orderBy: { measuredAt: "desc" },
      take: 10,
    }),
  ]);
  const latest: CaredPerson["latest"] = [];
  for (const type of ["PRESSAO", "GLICEMIA"] as const) {
    const m = measurements.find((x) => x.type === type);
    if (m) latest.push({ type, value: formatMeasurement(m), measuredAt: m.measuredAt.toISOString() });
  }
  return { linkId, name, doses, streakDays, latest };
}

export async function getCareOverview(userId: string, now: Date = new Date()): Promise<CareOverview> {
  const [asTitular, asCaregiver] = await Promise.all([
    prisma.careLink.findMany({
      where: { titularId: userId, status: { in: ["ACTIVE", "PENDING"] } },
      include: { caregiver: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.careLink.findMany({
      where: { caregiverId: userId, status: "ACTIVE" },
      include: { titular: { select: { id: true, name: true } } },
      orderBy: { acceptedAt: "asc" },
    }),
  ]);

  const pending = asTitular.find(
    (l) => l.status === "PENDING" && l.expiresAt && l.expiresAt.getTime() > Date.now()
  );
  const people = await Promise.all(asCaregiver.map((l) => caredPerson(l.id, l.titular.id, l.titular.name, now)));

  return {
    caregivers: asTitular
      .filter((l) => l.status === "ACTIVE" && l.caregiver)
      .map((l) => ({ linkId: l.id, name: l.caregiver!.name, since: (l.acceptedAt ?? l.createdAt).toISOString() })),
    pendingInvite: pending
      ? { linkId: pending.id, code: pending.inviteCode, expiresAt: pending.expiresAt!.toISOString() }
      : null,
    people,
  };
}

/** Resumo leve pro card do Home: quem eu acompanho e como estão as doses. */
export async function getCaregivingSummary(
  userId: string,
  now: Date = new Date()
): Promise<{ linkId: string; name: string; dosesTaken: number; dosesTotal: number; overdue: number }[]> {
  const links = await prisma.careLink.findMany({
    where: { caregiverId: userId, status: "ACTIVE" },
    include: { titular: { select: { id: true, name: true } } },
  });
  return Promise.all(
    links.map(async (l) => {
      const doses = await getTodayDoses(l.titular.id, now);
      return {
        linkId: l.id,
        name: l.titular.name,
        dosesTaken: doses.filter((d) => d.taken).length,
        dosesTotal: doses.length,
        overdue: doses.filter((d) => d.overdue).length,
      };
    })
  );
}
