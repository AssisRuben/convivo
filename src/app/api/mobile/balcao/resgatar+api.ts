import { getApiUserId } from "@/lib/apiAuth";
import { redeemAtCounter } from "@/lib/wallet/redemptionCore";

/** Confirma o resgate. Body: { code, purchaseCents, amountCents, saleNumber? }. */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const result = await redeemAtCounter(userId, {
      code: String(body?.code ?? ""),
      purchaseCents: Number(body?.purchaseCents),
      amountCents: Number(body?.amountCents),
      saleNumber: typeof body?.saleNumber === "string" ? body.saleNumber : null,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível resgatar";
    return Response.json({ error: message }, { status: 400 });
  }
}
