import { getApiUserId } from "@/lib/apiAuth";
import { getOrCreateCart, removeCartItem, updateCartItemQuantity } from "@/lib/cart";

export async function PATCH(request: Request, { itemId }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const quantity = Number(body?.quantity);

  if (!Number.isFinite(quantity)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await updateCartItemQuantity(userId, itemId, quantity);
  const cart = await getOrCreateCart(userId);
  return Response.json({ cart });
}

export async function DELETE(request: Request, { itemId }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  await removeCartItem(userId, itemId);
  const cart = await getOrCreateCart(userId);
  return Response.json({ cart });
}
