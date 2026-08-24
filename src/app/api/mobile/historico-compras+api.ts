import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getPurchaseHistoryForUser } from "@/lib/pharmacyDb";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { cpf: true, phone: true },
  });
  if (!user.cpf && !user.phone) {
    return Response.json({ items: [], needsContactInfo: true });
  }

  const items = await getPurchaseHistoryForUser(user.cpf, user.phone);
  return Response.json({ items, needsContactInfo: false });
}
