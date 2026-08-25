import { useState } from "react";
import { Image } from "react-native";
import { fallbackImageForCategory, type CatalogCategorySlug } from "@/constants/catalogCategories";

/**
 * A URL de imagem do produto vem de fonte externa (Open Food/Products
 * Facts ou Cosmos, ver lib/catalog/productImage.ts) e é resolvida uma vez
 * só, cacheada pra sempre no espelho local — se o link cair depois (CDN
 * mudou, produto saiu do ar lá), ninguém re-resolve sozinho. `onError`
 * troca pro ícone de categoria na hora, sem precisar de intervenção manual.
 *
 * Quem usa deve passar `key={uri}` (ver callsites) — assim, se o produto
 * mostrado mudar com a mesma instância do componente pai viva (ex: navegar
 * de um /produto/[codigo] pra outro), o estado local de "falhou" reseta
 * remontando em vez de precisar de efeito pra sincronizar.
 */
export function ProductImage({
  uri,
  category,
  className,
}: {
  uri: string;
  category: CatalogCategorySlug;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = { uri: failed ? fallbackImageForCategory(category) : uri };

  return (
    <Image source={source} resizeMode="contain" className={className} onError={() => setFailed(true)} />
  );
}
