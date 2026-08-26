import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { apiFetch, type ApiCatalogProductDetail } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { ProductImage } from "@/components/catalog/ProductImage";
import { useCart } from "@/lib/cartState";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutoScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ApiCatalogProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    apiFetch(`/api/mobile/catalog/produto/${codigo}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) setProduct(data.product);
        else setNotFound(true);
      });
  }, [codigo]);

  // Local, instantâneo — nada de chamada de rede aqui. O carrinho só fala
  // com o servidor no "Finalizar pedido" (ver carrinho.tsx), que resolve
  // preço/estoque ao vivo de qualquer forma — não tem risco em confiar no
  // que já está na tela agora.
  function addToCart() {
    if (!product) return;
    addItem(
      {
        codigoProduto: product.codigo,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        category: product.category,
        stock: product.stock,
      },
      1
    );
    showAlert("Adicionado!", "Produto adicionado ao carrinho.", [
      { text: "Continuar comprando", style: "cancel" },
      { text: "Ver carrinho", onPress: () => router.push("/carrinho") },
    ]);
  }

  if (notFound) {
    return (
      <View className="flex-1 items-center justify-center bg-cream p-4">
        <Text className="text-center text-navy/60">
          Esse produto não está mais disponível.
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <ScrollView className="flex-1 bg-cream">
      <ProductImage key={product.imageUrl} uri={product.imageUrl} category={product.category} className="h-72 w-full" />
      <View className="gap-2 p-4">
        <Text className="text-xl font-bold text-navy">{product.name}</Text>
        {product.description && <Text className="text-navy/70">{product.description}</Text>}
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold text-navy">{formatPrice(product.priceCents)}</Text>
          {product.emPromocao && product.precoAnteriorCents && (
            <Text className="text-sm text-navy/40 line-through">
              {formatPrice(product.precoAnteriorCents)}
            </Text>
          )}
        </View>
        {outOfStock && <Text className="text-sm font-medium text-coral">Esgotado no momento</Text>}
        {product.exigeReceita && (
          <View className="mt-1 flex-row items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2">
            <Text className="text-xs font-medium text-amber-700">
              Este produto exige receita — a conferência é feita no ato da entrega.
            </Text>
          </View>
        )}

        <Pressable
          disabled={outOfStock}
          onPress={addToCart}
          className="mt-4 items-center rounded-xl bg-navy p-3.5 disabled:opacity-50"
        >
          <Text className="font-semibold text-white">
            {outOfStock ? "Indisponível" : "Adicionar ao carrinho"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
