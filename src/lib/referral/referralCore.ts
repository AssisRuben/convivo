import { prisma } from "@/lib/prisma";
import { getWalletBalanceCents } from "@/lib/wallet";

/**
 * Indique e Ganhe: o código de cada cliente, quem ele indicou e o código
 * que ele mesmo vinculou (de um amigo ou de um vendedor). Cada cliente
 * tem um código vinculado por vez — dá pra remover e vincular outro.
 */

/** Código digitado com espaço/minúscula vira o formato gravado. */
export function normalizeReferralCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** "Maria Silva Santos" -> "Maria S." — pra mostrar a quem não é da casa
 * (quem digitou o código, a lista de indicados) sem o nome completo. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0].toUpperCase() + parts[0].slice(1).toLowerCase();
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}

export type CodeOwner = { name: string; kind: "amigo" | "vendedor" };

/** De quem é o código (pra confirmar antes de vincular/cadastrar). */
export async function lookupReferralCode(rawCode: string): Promise<CodeOwner | null> {
  const code = normalizeReferralCode(rawCode);
  if (code.length < 4) return null;
  const owner = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { name: true, isVendedor: true, deletedAt: true },
  });
  if (!owner || owner.deletedAt) return null;
  return { name: shortName(owner.name), kind: owner.isVendedor ? "vendedor" : "amigo" };
}

export type ReferralOverview = {
  userName: string;
  referralCode: string;
  referralCount: number;
  saldoCents: number;
  /** Código que este cliente vinculou (um por vez). */
  linked: (CodeOwner & { code: string }) | null;
  friends: { name: string; since: string }[];
  // compat com app antigo
  hasReferrer: boolean;
  hasVendedor: boolean;
};

export async function getReferralOverview(userId: string): Promise<ReferralOverview> {
  const [user, saldoCents] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        referralCode: true,
        referredBy: { select: { name: true, referralCode: true } },
        vendedor: { select: { name: true, referralCode: true } },
        referrals: {
          where: { deletedAt: null },
          select: { name: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 200,
        },
      },
    }),
    getWalletBalanceCents(userId),
  ]);

  // Conta antiga pode ter os dois; mostra o de amigo primeiro.
  const linked = user.referredBy
    ? { name: shortName(user.referredBy.name), kind: "amigo" as const, code: user.referredBy.referralCode }
    : user.vendedor
      ? { name: shortName(user.vendedor.name), kind: "vendedor" as const, code: user.vendedor.referralCode }
      : null;

  return {
    userName: user.name,
    referralCode: user.referralCode,
    referralCount: user.referrals.length,
    saldoCents,
    linked,
    friends: user.referrals.map((r) => ({ name: shortName(r.name), since: r.createdAt.toISOString() })),
    hasReferrer: user.referredBy != null,
    hasVendedor: user.vendedor != null,
  };
}

/** Remove o código vinculado (os dois, se conta antiga tiver amigo e
 * vendedor) — depois a pessoa pode vincular outro. */
export async function unlinkReferralCode(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { referredById: null, vendedorId: null } });
}
