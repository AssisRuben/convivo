import { getApiUserId } from "@/lib/apiAuth";
import { getOrCreateCart } from "@/lib/cart";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const cart = await getOrCreateCart(userId);
  return Response.json({ cart });
}
