import { getApiUserId } from "@/lib/apiAuth";
import { getCareOverview } from "@/lib/care/caregiverCore";

/** Família e cuidadores: quem me acompanha, convite aberto e quem eu acompanho. */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  return Response.json(await getCareOverview(userId));
}
