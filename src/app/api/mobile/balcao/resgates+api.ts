import { getApiUserId } from "@/lib/apiAuth";
import { listRedemptionsToday } from "@/lib/wallet/redemptionCore";

/** Resgates do dia (gestor: todos; atendente: os dele). */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    return Response.json(await listRedemptionsToday(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sem permissão";
    return Response.json({ error: message }, { status: 403 });
  }
}
