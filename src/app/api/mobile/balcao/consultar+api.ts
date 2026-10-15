import { getApiUserId } from "@/lib/apiAuth";
import { lookupRedeemCode } from "@/lib/wallet/redemptionCore";

/** Atendente digita o código do cliente: nome e saldo. Body: { code }. */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    return Response.json(await lookupRedeemCode(userId, String(body?.code ?? "")));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar";
    return Response.json({ error: message }, { status: 400 });
  }
}
