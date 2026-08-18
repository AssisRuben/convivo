import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.userId !== userId) {
    return Response.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return Response.json({ order });
}
