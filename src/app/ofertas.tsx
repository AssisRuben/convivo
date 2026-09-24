import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { apiFetch, type ApiCatalogPromoItem } from "@/lib/api";
import { ProductImage } from "@/components/catalog/ProductImage";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OfertasScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ApiCatalogPromoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/api/mobile/ofertas")
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.codigo)}
        contentContainerClassName="gap-3 p-4 pb-24"
        ListHeaderComponent={<Text className="mb-1 text-xl font-bold text-navy">Ofertas 🔥</Text>}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-navy/60">Nenhuma promoção ativa agora.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/produto/${item.codigo}`)}
            className="flex-row gap-3 rounded-2xl bg-card p-3 shadow-sm"
          >
            <ProductImage
              key={item.imageUrl}
              uri={item.imageUrl}
              category={item.category}
              className="h-16 w-16 rounded-xl"
            />
            <View className="flex-1 justify-center">
              <Text className="font-semibold text-navy">{item.name}</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="font-semibold text-coral">
                  {formatPrice(item.precoPromocionalCents)}
                </Text>
                <Text className="text-xs text-navy/40 line-through">
                  {formatPrice(item.priceCents)}
                </Text>
              </View>
              {item.stock <= 0 && <Text className="text-xs text-coral">Esgotado</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
