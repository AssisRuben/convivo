import { getApiUserId } from "@/lib/apiAuth";
import { getStaffAccess } from "@/lib/wallet/redemptionCore";

/** Quem pode resgatar créditos no balcão (o menu mostra a tela só pra eles). */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  return Response.json(await getStaffAccess(userId));
}
