import { getApiUserId } from "@/lib/apiAuth";
import { getRedeemCodeStatus } from "@/lib/wallet/redemptionCore";

/** O app do cliente acompanha o código: usado (e quanto) ou vencido. */
export async function GET(request: Request, { code }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  return Response.json(await getRedeemCodeStatus(userId, code));
}
