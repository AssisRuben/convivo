import { getApiUserId } from "@/lib/apiAuth";
import { getActivePromotions } from "@/lib/catalog/catalogDb";
import { toBrowseView } from "@/lib/catalog/catalogView";

const OFERTAS_LIMIT = 60;

/** Lista completa de promoções ativas — atalho "Ofertas" na Home. */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const promotionsRaw = await getActivePromotions(OFERTAS_LIMIT);
  const promotionsView = await toBrowseView(promotionsRaw);

  const products = promotionsView.map((item, i) => ({
    ...item,
    precoPromocionalCents: promotionsRaw[i].precoPromocionalCents,
  }));

  return Response.json({ products });
}
