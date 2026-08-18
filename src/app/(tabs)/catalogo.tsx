import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { apiFetch, type ApiProduct } from "@/lib/api";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CatalogScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      apiFetch("/api/mobile/products")
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setProducts(data.products ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-cream"
      data={products}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-4 pb-24"
      ListEmptyComponent={
        <Text className="mt-8 text-center text-navy/60">Nenhum produto cadastrado ainda.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/produto/${item.id}`)}
          className="flex-row gap-3 rounded-2xl bg-card p-3 shadow-sm"
        >
          <Image source={{ uri: item.imageUrl }} className="h-16 w-16 rounded-xl" />
          <View className="flex-1 justify-center">
            <Text className="font-semibold text-navy">{item.name}</Text>
            <Text numberOfLines={2} className="text-sm text-navy/60">
              {item.description}
            </Text>
            <Text className="mt-1 font-semibold text-navy">{formatPrice(item.priceCents)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}
