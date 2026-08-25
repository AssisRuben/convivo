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

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutoScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ApiCatalogProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    apiFetch(`/api/mobile/catalog/produto/${codigo}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) setProduct(data.product);
        else setNotFound(true);
      });
  }, [codigo]);

  async function addToCart() {
    setAdding(true);
    try {
      const res = await apiFetch("/api/mobile/cart/items", {
        method: "POST",
        body: JSON.stringify({ codigoProduto: Number(codigo), quantity: 1 }),
      });
      if (!res.ok) throw new Error();
      showAlert("Adicionado!", "Produto adicionado ao carrinho.", [
        { text: "Continuar comprando", style: "cancel" },
        { text: "Ver carrinho", onPress: () => router.push("/carrinho") },
      ]);
    } catch {
      showAlert("Erro", "Não foi possível adicionar ao carrinho.");
    } finally {
      setAdding(false);
    }
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

        <Pressable
          disabled={adding || outOfStock}
          onPress={addToCart}
          className="mt-4 items-center rounded-xl bg-navy p-3.5 disabled:opacity-50"
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">
              {outOfStock ? "Indisponível" : "Adicionar ao carrinho"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
