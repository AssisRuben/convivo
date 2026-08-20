import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { approveOrder } from "@/lib/orders/orderCore";

// Stand-in temporário pro webhook real do Mercado Pago — enquanto não
// existe gateway configurado, essa rota simula a confirmação de
// pagamento pra exercitar o resto do pipeline (Trier + comissão).
export async function POST(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== userId) {
    return Response.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return Response.json({ error: "Pedido não está pendente" }, { status: 400 });
  }

  await approveOrder(id);
  const updated = await prisma.order.findUniqueOrThrow({ where: { id } });
  return Response.json({ order: updated });
}
