import { getApiUserId } from "@/lib/apiAuth";
import { getWalletBalanceCents } from "@/lib/wallet";

/**
 * Endpoint dedicado (não reaproveita /indicacao, que é sobre o programa de
 * indicação especificamente) — carrinho e recompra de medicamento usam
 * este pra saber o saldo disponível antes de escolher quanto resgatar.
 */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const saldoCents = await getWalletBalanceCents(userId);
  return Response.json({ saldoCents });
}
