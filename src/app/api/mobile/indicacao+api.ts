import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [user, saldo] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { referralCode: true, _count: { select: { referrals: true } } },
    }),
    prisma.walletEntry.aggregate({
      where: { userId },
      _sum: { amountCents: true },
    }),
  ]);

  return Response.json({
    referralCode: user.referralCode,
    referralCount: user._count.referrals,
    saldoCents: saldo._sum.amountCents ?? 0,
  });
}
