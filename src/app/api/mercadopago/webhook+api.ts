import { approveOrder, rejectOrder } from "@/lib/orders/orderCore";
import {
  fetchPaymentStatus,
  mapMpStatusToOrderAction,
  verifyWebhookSignature,
} from "@/lib/orders/mercadopago";
import { prisma } from "@/lib/prisma";

/**
 * Chamada direta pelo Mercado Pago, não pelo app — por isso fora de
 * api/mobile e sem Bearer token (getApiUserId). Quem autentica essa rota é
 * a verificação de assinatura (x-signature), não uma sessão de usuário.
 * Responde sempre 200 depois de passar da assinatura, mesmo em erro
 * interno — o MP reenvia agressivamente em qualquer resposta não-2xx, e
 * essa rota já é idempotente (approveOrder/rejectOrder só agem se o
 * pedido ainda estiver PENDING).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || body.type !== "payment" || !body.data?.id) {
    return Response.json({ ok: true }, { status: 200 });
  }

  const dataId = String(body.data.id);
  const requestId = request.headers.get("x-request-id");
  if (!verifyWebhookSignature(request.headers, dataId, requestId)) {
    return Response.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  try {
    const payment = await fetchPaymentStatus(dataId);
    if (!payment.externalReference) {
      return Response.json({ ok: true }, { status: 200 });
    }

    const order = await prisma.order.findUnique({ where: { id: payment.externalReference } });
    if (!order || order.status !== "PENDING") {
      return Response.json({ ok: true }, { status: 200 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPaymentId: dataId, mpStatus: payment.status },
    });

    const action = mapMpStatusToOrderAction(payment.status);
    if (action === "approve") await approveOrder(order.id);
    else if (action === "reject") await rejectOrder(order.id, `Mercado Pago: ${payment.status}`);
  } catch {
    // Best-effort — não deixa vazar detalhe interno na resposta, e ainda
    // assim responde 200 pra não entrar num loop de reenvio do MP; o
    // status fica registrado como PENDING até o próximo webhook chegar.
  }

  return Response.json({ ok: true }, { status: 200 });
}
