import { getApiUserId } from "@/lib/apiAuth";
import { isMercadoPagoConfigured } from "@/lib/orders/mercadopago";

/**
 * A tela de checkout consulta isso pra esconder a opção de pagar online em
 * vez de deixar escolher algo que só ia falhar depois — mesmo espírito do
 * trierError silencioso, mas verificado antes de tentar em vez de depois.
 */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  return Response.json({ mercadoPagoAvailable: isMercadoPagoConfigured() });
}
