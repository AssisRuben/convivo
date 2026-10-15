import { getApiUserId } from "@/lib/apiAuth";
import { getWalletOverview } from "@/lib/wallet/redemptionCore";

/** Meus créditos: saldo, vencimentos e extrato. */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  return Response.json(await getWalletOverview(userId));
}
