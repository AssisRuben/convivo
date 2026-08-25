import { prisma } from "@/lib/prisma";
import { fallbackImageForCategory, mapGrupoToCategory } from "@/constants/catalogCategories";
import { fetchProductImageUrl } from "@/lib/catalog/productImage";
import type { CatalogProduct } from "@/lib/catalog/catalogDb";
import type { Product } from "@/lib/generated/prisma/client";

/**
 * Espelha um produto do catálogo real na tabela local Product ("write-
 * through" — ver comentário no model Product do schema), chaveado por
 * codigoProduto. Preço/estoque/custo sempre vêm frescos do parâmetro
 * (quem chama já buscou ao vivo); imagem só é resolvida na criação da
 * linha — depois fica cacheada, nunca refeita.
 */
export async function mirrorCatalogProduct(
  catalogProduct: CatalogProduct,
  stockOverride?: number
): Promise<Product> {
  const category = mapGrupoToCategory(catalogProduct.grupo);
  const stock = stockOverride ?? catalogProduct.estoqueAtual;

  const existing = await prisma.product.findUnique({
    where: { codigoProduto: catalogProduct.codigo },
    select: { imageUrl: true },
  });

  const imageUrl =
    existing?.imageUrl ||
    (await fetchProductImageUrl(catalogProduct.codigoBarras)) ||
    fallbackImageForCategory(category);

  return prisma.product.upsert({
    where: { codigoProduto: catalogProduct.codigo },
    create: {
      codigoProduto: catalogProduct.codigo,
      name: catalogProduct.nome,
      priceCents: catalogProduct.precoCents,
      costCents: catalogProduct.custoMedioCents,
      stock,
      category,
      imageUrl,
    },
    update: {
      name: catalogProduct.nome,
      priceCents: catalogProduct.precoCents,
      costCents: catalogProduct.custoMedioCents,
      stock,
      category,
    },
  });
}
