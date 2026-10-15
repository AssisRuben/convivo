import { getApiUserId } from "@/lib/apiAuth";
import { listRedemptionsToday, reverseRedemption } from "@/lib/wallet/redemptionCore";

/** Gestor estorna um resgate: o crédito volta pro cliente. */
export async function POST(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    await reverseRedemption(userId, id);
    return Response.json(await listRedemptionsToday(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível estornar";
    return Response.json({ error: message }, { status: 400 });
  }
}
