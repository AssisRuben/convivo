import { getApiUserId } from "@/lib/apiAuth";
import { getCatalogProductByCodigo } from "@/lib/catalog/catalogDb";
import { mirrorCatalogProduct } from "@/lib/catalog/catalogMirror";
import { mapGrupoToCategory } from "@/constants/catalogCategories";

export async function GET(request: Request, { codigo }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const codigoNum = Number(codigo);
  if (!Number.isFinite(codigoNum)) {
    return Response.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  // Busca ao vivo, sempre — nunca serve o espelho local direto aqui, pra
  // não devolver um produto que ficou sem estoque ou virou controlado
  // desde a última vez que alguém olhou.
  const catalogProduct = await getCatalogProductByCodigo(codigoNum);
  if (!catalogProduct) {
    return Response.json({ error: "Produto não encontrado ou indisponível" }, { status: 404 });
  }

  const mirrored = await mirrorCatalogProduct(catalogProduct);

  return Response.json({
    product: {
      codigo: catalogProduct.codigo,
      name: catalogProduct.nome,
      description: mirrored.description,
      priceCents: catalogProduct.precoCents,
      precoAnteriorCents: catalogProduct.precoAnteriorCents,
      emPromocao: catalogProduct.emPromocao,
      imageUrl: mirrored.imageUrl,
      stock: catalogProduct.estoqueAtual,
      category: mapGrupoToCategory(catalogProduct.grupo),
      exigeReceita: catalogProduct.exigeReceita,
    },
  });
}
