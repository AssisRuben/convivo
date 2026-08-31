import { prisma } from "@/lib/prisma";
import { verifyCpfPhoneMatch } from "@/lib/pharmacyDb";
import type { User } from "@/lib/generated/prisma/client";

const CPF_LOCKOUT_ATTEMPTS = 5;
const CPF_LOCKOUT_DURATION_MS = 60 * 60 * 1000;

export type CpfVerificationResult = "verified" | "mismatch" | "locked" | null;

/**
 * Perfil compartilhado entre a web (`lib/actions/profile.ts`) e o mobile
 * (`app/api/mobile/profile`) — mesmo padrão do `feedCore.ts`/`checklistCore.ts`.
 */

export type ProfileView = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  cpfVerified: boolean;
  phone: string | null;
  birthDate: string | null;
  cep: string | null;
  estado: string | null;
  cidade: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  complemento: string | null;
  heightCm: number | null;
  conditions: string[];
  allergies: string[];
};

export type ProfileInput = {
  name?: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  cep?: string | null;
  estado?: string | null;
  cidade?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  heightCm?: number | null;
  conditions?: string[];
  allergies?: string[];
};

function toView(user: User): ProfileView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    cpfVerified: user.cpfVerifiedAt != null,
    phone: user.phone,
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
    cep: user.cep,
    estado: user.estado,
    cidade: user.cidade,
    logradouro: user.logradouro,
    numero: user.numero,
    bairro: user.bairro,
    complemento: user.complemento,
    heightCm: user.heightCm,
    conditions: user.conditions,
    allergies: user.allergies,
  };
}

export async function getProfileForUser(userId: string): Promise<ProfileView> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return toView(user);
}

const CPF_DIGITS = /^\d{11}$/;
const CEP_DIGITS = /^\d{8}$/;
const ESTADO_UF = /^[A-Z]{2}$/;
// DDD (2) + número (8 fixo, ou 9 celular com o dígito 9 na frente) — 10 ou
// 11 dígitos ao todo. Sem isso, telefone salvo com formato solto (com ou
// sem DDD, com ou sem o 9º dígito) tornava a comparação com o telefone da
// Trier (verifyCpfPhoneMatch) mais frágil do que precisava.
const PHONE_DIGITS = /^\d{10,11}$/;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function validateProfileInput(input: ProfileInput) {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Nome não pode ficar vazio");
  }
  if (input.cpf) {
    if (!CPF_DIGITS.test(onlyDigits(input.cpf))) throw new Error("CPF inválido");
  }
  if (input.phone) {
    if (!PHONE_DIGITS.test(onlyDigits(input.phone))) {
      throw new Error("Telefone inválido — informe DDD + número, ex: (85) 91234-5678");
    }
  }
  if (input.cep) {
    if (!CEP_DIGITS.test(onlyDigits(input.cep))) throw new Error("CEP inválido");
  }
  if (input.estado) {
    if (!ESTADO_UF.test(input.estado.toUpperCase())) throw new Error("Estado inválido (use a sigla, ex: SP)");
  }
  if (input.heightCm != null && (input.heightCm < 50 || input.heightCm > 250)) {
    throw new Error("Altura inválida (informe em centímetros, entre 50 e 250)");
  }
  if (input.birthDate) {
    const date = new Date(input.birthDate);
    if (Number.isNaN(date.getTime())) throw new Error("Data de nascimento inválida");
    if (date > new Date()) throw new Error("Data de nascimento não pode ser no futuro");
  }
}

export async function updateProfileForUser(
  userId: string,
  input: ProfileInput
): Promise<{ profile: ProfileView; cpfVerification: CpfVerificationResult }> {
  validateProfileInput(input);

  const current = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.cpf !== undefined) data.cpf = input.cpf ? onlyDigits(input.cpf) : null;
  if (input.phone !== undefined) data.phone = input.phone ? onlyDigits(input.phone) : null;
  if (input.birthDate !== undefined) {
    data.birthDate = input.birthDate ? new Date(input.birthDate) : null;
  }
  if (input.cep !== undefined) data.cep = input.cep ? onlyDigits(input.cep) : null;
  if (input.estado !== undefined) data.estado = input.estado ? input.estado.toUpperCase() : null;
  if (input.cidade !== undefined) data.cidade = input.cidade || null;
  if (input.logradouro !== undefined) data.logradouro = input.logradouro || null;
  if (input.numero !== undefined) data.numero = input.numero || null;
  if (input.bairro !== undefined) data.bairro = input.bairro || null;
  if (input.complemento !== undefined) data.complemento = input.complemento || null;
  if (input.heightCm !== undefined) data.heightCm = input.heightCm;
  if (input.conditions !== undefined) {
    data.conditions = input.conditions.map((c) => c.trim()).filter(Boolean);
  }
  if (input.allergies !== undefined) {
    data.allergies = input.allergies.map((a) => a.trim()).filter(Boolean);
  }

  // Verificação de posse do CPF (ver comentário no schema) — qualquer
  // mudança em CPF ou telefone invalida a verificação anterior, só volta
  // a valer depois de bater de novo contra o telefone cadastrado na
  // Trier pra esse CPF. Tentativas contam por CPF (trocar de CPF zera o
  // contador — não é justo herdar bloqueio de um CPF diferente), pra
  // frear alguém testando telefones à toa contra o mesmo CPF.
  const nextCpf = input.cpf !== undefined ? (data.cpf as string | null) : current.cpf;
  const nextPhone = input.phone !== undefined ? (data.phone as string | null) : current.phone;
  const cpfChanged = input.cpf !== undefined && nextCpf !== current.cpf;
  const phoneChanged = input.phone !== undefined && nextPhone !== current.phone;

  let cpfVerification: CpfVerificationResult = null;

  if (cpfChanged || phoneChanged) {
    data.cpfVerifiedAt = null;
    if (cpfChanged) {
      data.cpfVerificationAttempts = 0;
      data.cpfVerificationLockedUntil = null;
    }

    if (nextCpf && nextPhone) {
      const now = new Date();
      const lockedUntil = cpfChanged ? null : current.cpfVerificationLockedUntil;
      if (lockedUntil && lockedUntil > now) {
        cpfVerification = "locked";
      } else {
        const matched = await verifyCpfPhoneMatch(nextCpf, nextPhone);
        if (matched) {
          data.cpfVerifiedAt = now;
          data.cpfVerificationAttempts = 0;
          data.cpfVerificationLockedUntil = null;
          cpfVerification = "verified";
        } else {
          const attempts = (cpfChanged ? 0 : current.cpfVerificationAttempts) + 1;
          data.cpfVerificationAttempts = attempts;
          if (attempts >= CPF_LOCKOUT_ATTEMPTS) {
            data.cpfVerificationLockedUntil = new Date(now.getTime() + CPF_LOCKOUT_DURATION_MS);
          }
          cpfVerification = "mismatch";
        }
      }
    }
  }

  try {
    const user = await prisma.user.update({ where: { id: userId }, data });
    return { profile: toView(user), cpfVerification };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new Error("Esse CPF já está cadastrado em outra conta");
    }
    throw error;
  }
}
