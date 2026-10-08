import { getApiUserId } from "@/lib/apiAuth";
import { createCareInvite, getCareOverview } from "@/lib/care/caregiverCore";

/** O titular gera (ou renova) o código de convite pra alguém o acompanhar. */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    await createCareInvite(userId);
    return Response.json(await getCareOverview(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o convite";
    return Response.json({ error: message }, { status: 400 });
  }
}
