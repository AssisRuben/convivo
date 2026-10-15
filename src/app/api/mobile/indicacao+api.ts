import { getApiUserId } from "@/lib/apiAuth";
import { getReferralOverview } from "@/lib/referral/referralCore";

/** Indique e Ganhe: código, indicados, saldo e o código que vinculei. */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  return Response.json(await getReferralOverview(userId));
}
