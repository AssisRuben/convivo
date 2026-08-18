import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/generated/prisma/client";

/**
 * Perfil compartilhado entre a web (`lib/actions/profile.ts`) e o mobile
 * (`app/api/mobile/profile`) — mesmo padrão do `feedCore.ts`/`checklistCore.ts`.
 */

export type ProfileView = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
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
): Promise<ProfileView> {
  validateProfileInput(input);

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.cpf !== undefined) data.cpf = input.cpf ? onlyDigits(input.cpf) : null;
  if (input.phone !== undefined) data.phone = input.phone || null;
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

  try {
    const user = await prisma.user.update({ where: { id: userId }, data });
    return toView(user);
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
