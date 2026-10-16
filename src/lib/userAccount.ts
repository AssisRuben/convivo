import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codes";
import { checkReferralMilestones } from "@/lib/timeline/achievements";
import type { User } from "@/lib/generated/prisma/client";
import { normalizeReferralCode } from "@/lib/referral/referralCore";
import { forgetActiveUser } from "@/lib/apiAuth";

export type CreateUserAccountInput = {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
};

export type CreateUserAccountResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export async function createUserAccount(
  input: CreateUserAccountInput
): Promise<CreateUserAccountResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return { ok: false, error: "Já existe uma conta com esse email" };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const referrer = input.referralCode
    ? await prisma.user.findUnique({ where: { referralCode: normalizeReferralCode(input.referralCode) } })
    : null;

  // O mesmo campo de código serve pros dois casos — quem é o dono do
  // código decide se vira indicação de amigo ou vínculo de vendedor (ver
  // attributeCode, abaixo, pro fluxo equivalente pós-cadastro).
  const referrerIsVendedor = referrer?.isVendedor ?? false;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          referralCode: generateCode(),
          referredById: referrer && !referrerIsVendedor ? referrer.id : undefined,
          vendedorId: referrer && referrerIsVendedor ? referrer.id : undefined,
          cart: { create: {} },
        },
      });

      if (referrer && !referrerIsVendedor) {
        // Sem crédito em dinheiro aqui — o modelo é comissão por compra do
        // indicado (ver lib/orders/orderCore.ts), não bônus de cadastro.
        // A meta em escada de "amigos indicados" continua contando
        // cadastro, é só o bichinho/badge, não afeta a carteira. Vínculo
        // de vendedor não entra nessa escada (é uma coisa diferente de
        // "amigos indicados").
        await checkReferralMilestones(referrer.id);
      }

      return { ok: true, user };
    } catch (error) {
      const isUniqueReferralCollision =
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2002" &&
        JSON.stringify((error as { meta?: unknown }).meta).includes("referralCode");
      if (!isUniqueReferralCollision || attempt === 4) throw error;
    }
  }
  throw new Error("Não foi possível criar a conta");
}

export type AttributeCodeResult =
  | { ok: true; kind: "amigo" | "vendedor" }
  | { ok: false; error: string };

/**
 * Vínculo de código depois do cadastro — mesma detecção automática
 * amigo/vendedor de createUserAccount, mas pra quem já tem conta (ex:
 * cliente cadastrado sem código que depois é atendido por um vendedor na
 * farmácia). Um código vinculado por cliente: pra trocar, remove o atual
 * antes (ver unlinkReferralCode em lib/referral/referralCore.ts).
 */
export async function attributeCode(userId: string, rawCode: string): Promise<AttributeCodeResult> {
  const code = normalizeReferralCode(rawCode);
  const owner = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!owner || owner.id === userId || owner.deletedAt) {
    return { ok: false, error: "Código não encontrado. Confira as letras e números." };
  }

  const linked = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referredById: true, vendedorId: true },
  });
  if (linked.referredById || linked.vendedorId) {
    return { ok: false, error: "Você já tem um código vinculado. Remova o atual para vincular outro." };
  }

  if (owner.isVendedor) {
    await prisma.user.update({ where: { id: userId }, data: { vendedorId: owner.id } });
    return { ok: true, kind: "vendedor" };
  }

  await prisma.user.update({ where: { id: userId }, data: { referredById: owner.id } });
  await checkReferralMilestones(owner.id);
  return { ok: true, kind: "amigo" };
}

export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export type DeleteUserAccountResult = { ok: true } | { ok: false; error: string };

/**
 * Exclusão de conta (LGPD) — anonimiza em vez de apagar a linha, porque
 * Order/WalletEntry/referredBy/vendedorId de OUTRAS pessoas apontam pra
 * cá (ver comentário no model User). Exige a senha de novo — ação
 * irreversível, não basta o token de sessão continuar válido.
 */
export async function deleteUserAccount(
  userId: string,
  password: string
): Promise<DeleteUserAccountResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    return { ok: false, error: "Conta não encontrada" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Senha incorreta" };
  }

  const inertPasswordHash = await bcrypt.hash(generateCode() + generateCode(), 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      name: "Usuário removido",
      email: `deleted-${userId}@convivo.invalid`,
      passwordHash: inertPasswordHash,
      cpf: null,
      cpfVerifiedAt: null,
      cpfVerificationAttempts: 0,
      cpfVerificationLockedUntil: null,
      phone: null,
      birthDate: null,
      cep: null,
      estado: null,
      cidade: null,
      logradouro: null,
      numero: null,
      bairro: null,
      complemento: null,
      heightCm: null,
      conditions: [],
      allergies: [],
    },
  });
  // o login guardado por 1 min (apiAuth) deixa de valer na hora
  forgetActiveUser(userId);

  return { ok: true };
}
