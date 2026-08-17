import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { apiFetch, type ApiProduct } from "@/lib/api";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    apiFetch(`/api/mobile/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data.product ?? null));
  }, [id]);

  async function addToCart() {
    setAdding(true);
    try {
      const res = await apiFetch("/api/mobile/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });
      if (!res.ok) throw new Error();
      Alert.alert("Adicionado!", "Produto adicionado ao carrinho.", [
        { text: "Continuar comprando", style: "cancel" },
        { text: "Ver carrinho", onPress: () => router.push("/carrinho") },
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível adicionar ao carrinho.");
    } finally {
      setAdding(false);
    }
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream">
      <Image source={{ uri: product.imageUrl }} className="h-72 w-full" />
      <View className="gap-2 p-4">
        <Text className="text-xl font-bold text-navy">{product.name}</Text>
        <Text className="text-navy/70">{product.description}</Text>
        <Text className="text-lg font-semibold text-navy">{formatPrice(product.priceCents)}</Text>

        <Pressable
          disabled={adding}
          onPress={addToCart}
          className="mt-4 items-center rounded-xl bg-navy p-3.5 disabled:opacity-50"
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Adicionar ao carrinho</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
