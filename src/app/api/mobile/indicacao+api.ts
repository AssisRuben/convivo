import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true, _count: { select: { referrals: true } } },
  });

  return Response.json({
    referralCode: user.referralCode,
    referralCount: user._count.referrals,
  });
}
