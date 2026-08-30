import { prisma } from "@/lib/prisma";
import { mapGrupoToCategory } from "@/constants/catalogCategories";
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

  // Medicamento nunca recebe foto de fonte externa/crowdsourced (Kodebar,
  // Open Food/Products Facts, Cosmos) — código de barras casa com o
  // produto certo, mas a FOTO anexada àquele código nessas bases pode
  // estar errada (upload trocado por outro contribuinte), e mostrar o
  // remédio errado é risco de segurança do paciente, não só estética.
  // Nenhuma fonte oficial (ANVISA/CMED) publica foto por GTIN — pesquisado
  // e confirmado, não existe alternativa confiável hoje. Ícone genérico é
  // mais seguro que uma foto real do produto errado.
  const imageUrl =
    category === "MEDICAMENTOS"
      ? ""
      : (
          await prisma.product.findUnique({
            where: { codigoProduto: catalogProduct.codigo },
            select: { imageUrl: true },
          })
        )?.imageUrl || (await fetchProductImageUrl(catalogProduct.codigoBarras)) || "";

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
      // Inclui imageUrl aqui (diferente de antes) pra permitir zerar foto
      // de medicamento já espelhado antes dessa política existir — pra
      // qualquer outra categoria o valor já é o cacheado/igual de sempre,
      // não muda nada na prática.
      imageUrl,
    },
  });
}
