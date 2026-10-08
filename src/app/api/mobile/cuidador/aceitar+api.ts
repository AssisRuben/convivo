import { getApiUserId } from "@/lib/apiAuth";
import { acceptCareInvite, getCareOverview } from "@/lib/care/caregiverCore";

/** O cuidador aceita com o código. Body: { code }. */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const { titularName } = await acceptCareInvite(userId, String(body?.code ?? ""));
    return Response.json({ titularName, ...(await getCareOverview(userId)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível aceitar o convite";
    return Response.json({ error: message }, { status: 400 });
  }
}
