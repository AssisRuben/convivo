import { getApiUserId } from "@/lib/apiAuth";
import { getCareOverview, revokeCareLink } from "@/lib/care/caregiverCore";

/** Desfaz o vínculo (titular ou cuidador) ou cancela o convite aberto. */
export async function DELETE(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    await revokeCareLink(userId, id);
    return Response.json(await getCareOverview(userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível desfazer";
    return Response.json({ error: message }, { status: 400 });
  }
}
