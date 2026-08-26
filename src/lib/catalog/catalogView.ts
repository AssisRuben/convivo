import { prisma } from "@/lib/prisma";
import { mapGrupoToCategory, type CatalogCategorySlug } from "@/constants/catalogCategories";
import { mirrorCatalogProduct } from "@/lib/catalog/catalogMirror";
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
      // "" quando ainda não tem foto cacheada — ProductImage.tsx renderiza
      // o ícone de categoria local nesse caso.
      imageUrl: cachedImageByCodigo.get(product.codigo) || "",
      stock: product.estoqueAtual,
      category,
    };
  });
}

/**
 * Mesma visão, mas espelhando de verdade (resolve foto agora, não só usa
 * cache) — só pra conjuntos pequenos e limitados (home: destaques/
 * promoções/prévia de categoria, no máximo ~12 itens cada). A vitrine
 * completa de uma categoria (paginada, potencialmente milhares de itens
 * ao rolar) continua em toBrowseView — resolver foto de tudo ali gastaria
 * a cota gratuita da Cosmos à toa. Aqui compensa: é a primeira impressão
 * do catálogo, e o resultado fica cacheado pra sempre (chamadas seguintes
 * são baratas, toBrowseView reaproveita).
 */
export async function toBrowseViewEager(products: CatalogProduct[]): Promise<CatalogBrowseItem[]> {
  const mirrored = await Promise.all(products.map((product) => mirrorCatalogProduct(product)));

  return products.map((product, i) => ({
    codigo: product.codigo,
    name: product.nome,
    priceCents: product.precoCents,
    precoAnteriorCents: product.precoAnteriorCents,
    emPromocao: product.emPromocao,
    imageUrl: mirrored[i].imageUrl,
    stock: product.estoqueAtual,
    category: mapGrupoToCategory(product.grupo),
  }));
}
