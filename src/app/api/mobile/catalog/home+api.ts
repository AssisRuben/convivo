import { getApiUserId } from "@/lib/apiAuth";
import { getActivePromotions, listCatalogForBrowsing } from "@/lib/catalog/catalogDb";
import { toBrowseView } from "@/lib/catalog/catalogView";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_META,
  grupoValuesForCategory,
} from "@/constants/catalogCategories";

const PRODUCTS_PER_SECTION = 12;

// "Destaques" não tem nenhum sinal de popularidade na origem (sem
// contador de venda, sem ranking) — é uma seleção simples e determinística
// (mais recentemente atualizados), não "mais vendido". Documentado aqui
// pra não parecer curadoria de verdade quando não é.
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [destaquesRaw, promocoesRaw] = await Promise.all([
    listCatalogForBrowsing({ limit: PRODUCTS_PER_SECTION, orderBy: "updated_at" }),
    getActivePromotions(PRODUCTS_PER_SECTION),
  ]);

  // toBrowseView é só leitura de cache local (sem chamar fonte de imagem
  // externa) — a Home não pode mais esperar Kodebar/Open Facts/Cosmos
  // resolverem foto de ~70 itens na hora (isso levava a tela a mais de
  // 10s pra abrir). Foto de produto nunca visto ainda entra depois, via
  // o backfill diário (scripts/backfill-product-images.ts) ou na hora
  // que alguém abre o detalhe do produto (produto/[codigo]+api.ts, que
  // continua resolvendo ao vivo — ali é só 1 item, não ~70).
  const [destaquesView, promocoesView, categorias] = await Promise.all([
    toBrowseView(destaquesRaw),
    toBrowseView(promocoesRaw),
    Promise.all(
      CATALOG_CATEGORIES.filter((slug) => slug !== "OUTROS").map(async (slug) => {
        const products = await listCatalogForBrowsing({
          grupos: grupoValuesForCategory(slug),
          limit: PRODUCTS_PER_SECTION,
        });
        return {
          slug,
          label: CATALOG_CATEGORY_META[slug].label,
          products: await toBrowseView(products),
        };
      })
    ),
  ]);

  return Response.json({
    destaques: destaquesView,
    promocoes: promocoesView.map((item, i) => ({
      ...item,
      precoPromocionalCents: promocoesRaw[i].precoPromocionalCents,
    })),
    categorias: categorias.filter((c) => c.products.length > 0),
  });
}
