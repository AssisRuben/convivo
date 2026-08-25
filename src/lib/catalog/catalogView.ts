import { prisma } from "@/lib/prisma";
import { mapGrupoToCategory, type CatalogCategorySlug } from "@/constants/catalogCategories";
import { fallbackImageForCategory } from "@/constants/catalogCategories";
import type { CatalogProduct } from "@/lib/catalog/catalogDb";

export type CatalogBrowseItem = {
  codigo: number;
  name: string;
  priceCents: number;
  precoAnteriorCents: number | null;
  emPromocao: boolean;
  imageUrl: string;
  stock: number;
  category: CatalogCategorySlug;
};

/**
 * Monta a visão de lista/vitrine SEM espelhar (sem escrever no banco local
 * nem chamar a Cosmos) — mirorCatalogProduct só roda quando um produto
 * específico é tocado de verdade (detalhe, carrinho, pedido). Pra lista,
 * reaproveita imagem já cacheada de um toque anterior se existir; senão
 * usa o ícone genérico da categoria, sem gastar uma chamada de imagem por
 * item só de passar o olho na vitrine.
 */
export async function toBrowseView(products: CatalogProduct[]): Promise<CatalogBrowseItem[]> {
  const codigos = products.map((p) => p.codigo);
  const cached = codigos.length
    ? await prisma.product.findMany({
        where: { codigoProduto: { in: codigos } },
        select: { codigoProduto: true, imageUrl: true },
      })
    : [];
  const cachedImageByCodigo = new Map(cached.map((row) => [row.codigoProduto, row.imageUrl]));

  return products.map((product) => {
    const category = mapGrupoToCategory(product.grupo);
    return {
      codigo: product.codigo,
      name: product.nome,
      priceCents: product.precoCents,
      precoAnteriorCents: product.precoAnteriorCents,
      emPromocao: product.emPromocao,
      imageUrl: cachedImageByCodigo.get(product.codigo) || fallbackImageForCategory(category),
      stock: product.estoqueAtual,
      category,
    };
  });
}
