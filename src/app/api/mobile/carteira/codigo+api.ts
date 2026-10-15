import { getApiUserId } from "@/lib/apiAuth";
import { createRedeemCode } from "@/lib/wallet/redemptionCore";

/** Gera (ou reaproveita) o código de 6 dígitos pra usar os créditos no balcão. */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    return Response.json(await createRedeemCode(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o código";
    return Response.json({ error: message }, { status: 400 });
  }
}
