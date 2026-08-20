import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { createOrderFromCart } from "@/lib/orders/orderCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ orders });
}

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const order = await createOrderFromCart(userId);
    return Response.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o pedido";
    return Response.json({ error: message }, { status: 400 });
  }
}
