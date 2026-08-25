import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codes";
import { checkReferralMilestones } from "@/lib/timeline/achievements";
import type { User } from "@/lib/generated/prisma/client";

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
    ? await prisma.user.findUnique({ where: { referralCode: input.referralCode } })
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
 * farmácia). Cada tipo de vínculo só pode ser setado uma vez por usuário
 * (trava no primeiro, sem sobrescrever).
 */
export async function attributeCode(userId: string, code: string): Promise<AttributeCodeResult> {
  const owner = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!owner || owner.id === userId) {
    return { ok: false, error: "Código inválido" };
  }

  if (owner.isVendedor) {
    const current = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { vendedorId: true },
    });
    if (current.vendedorId) {
      return { ok: false, error: "Você já tem um vendedor vinculado" };
    }
    await prisma.user.update({ where: { id: userId }, data: { vendedorId: owner.id } });
    return { ok: true, kind: "vendedor" };
  }

  const current = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referredById: true },
  });
  if (current.referredById) {
    return { ok: false, error: "Você já foi indicado por alguém" };
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
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
