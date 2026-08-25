import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getWalletBalanceCents } from "@/lib/wallet";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [user, saldoCents] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        referralCode: true,
        referredById: true,
        vendedorId: true,
        _count: { select: { referrals: true } },
      },
    }),
    getWalletBalanceCents(userId),
  ]);

  return Response.json({
    referralCode: user.referralCode,
    referralCount: user._count.referrals,
    saldoCents,
    hasReferrer: user.referredById != null,
    hasVendedor: user.vendedorId != null,
  });
}
