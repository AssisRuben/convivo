import { getApiUserId } from "@/lib/apiAuth";
import { getWisdomTopicsSummaryForUser } from "@/lib/wisdom/wisdomCore";

/** Hub de "Pílulas de sabedoria" — um resumo por tópico (Decisões e Vieses, Estoicismo, Odisseia). */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const topics = await getWisdomTopicsSummaryForUser(userId);
  return Response.json({ topics });
}
