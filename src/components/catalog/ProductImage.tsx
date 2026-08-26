import { useState } from "react";
import { Image, Text, View } from "react-native";
import { categoryEmoji } from "@/constants/catalogCategories";

/**
 * A URL de imagem do produto vem de fonte externa (Open Food/Products
 * Facts ou Cosmos, ver lib/catalog/productImage.ts) e é resolvida uma vez
 * só, cacheada pra sempre no espelho local — se o link cair depois (CDN
 * mudou, produto saiu do ar lá), ninguém re-resolve sozinho. `onError`
 * troca pro ícone de categoria na hora, sem precisar de intervenção manual.
 *
 * O fallback (sem foto ainda, ou link quebrado) é renderizado local — um
 * emoji nativo, não outra imagem externa. Chegou a ser um placehold.co
 * gerando a imagem com o emoji como texto, mas o serviço não renderiza
 * emoji corretamente (virava um "?"); texto nativo do RN não tem esse
 * problema, é a fonte do próprio SO/navegador.
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
  category: string | null | undefined;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View className={`items-center justify-center bg-navy/5 ${className ?? ""}`}>
        <Text style={{ fontSize: 40 }}>{categoryEmoji(category)}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
