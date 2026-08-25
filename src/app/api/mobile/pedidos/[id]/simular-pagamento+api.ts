import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { approveOrder } from "@/lib/orders/orderCore";
import { isMercadoPagoConfigured } from "@/lib/orders/mercadopago";

// Stand-in temporário pro webhook real do Mercado Pago — enquanto não
// existe gateway configurado, essa rota simula a confirmação de
// pagamento pra exercitar o resto do pipeline (Trier + comissão). Se
// desligar sozinha assim que MP_ACCESS_TOKEN/APP_PUBLIC_BASE_URL forem
// configurados de verdade: sem esse guard, qualquer usuário autenticado
// podia forçar aprovação do próprio pedido pendente sem pagar nada —
// achado numa revisão de segurança, nunca chegou a rodar em produção
// com Mercado Pago configurado.
export async function POST(request: Request, { id }: Record<string, string>) {
  if (isMercadoPagoConfigured()) {
    return Response.json({ error: "Simulação desativada — Mercado Pago está configurado" }, { status: 403 });
  }

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
