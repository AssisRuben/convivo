import { getApiUserId } from "@/lib/apiAuth";
import { listCatalogForBrowsing } from "@/lib/catalog/catalogDb";
import { toBrowseView } from "@/lib/catalog/catalogView";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_META,
  grupoValuesForCategory,
  type CatalogCategorySlug,
} from "@/constants/catalogCategories";

export async function GET(request: Request, { slug }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!CATALOG_CATEGORIES.includes(slug as CatalogCategorySlug)) {
    return Response.json({ error: "Categoria não encontrada" }, { status: 404 });
  }
  const categorySlug = slug as CatalogCategorySlug;

  const url = new URL(request.url);
  const offset = Number(url.searchParams.get("offset") ?? 0) || 0;

  const products = await listCatalogForBrowsing({
    grupos: grupoValuesForCategory(categorySlug),
    limit: 30,
    offset,
  });

  return Response.json({
    label: CATALOG_CATEGORY_META[categorySlug].label,
    products: await toBrowseView(products),
    hasMore: products.length === 30,
  });
}
