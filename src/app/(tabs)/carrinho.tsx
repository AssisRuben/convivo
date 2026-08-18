import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { apiFetch, type ApiCart } from "@/lib/api";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CarrinhoScreen() {
  const [cart, setCart] = useState<ApiCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/api/mobile/cart")
      .then((res) => res.json())
      .then((data) => setCart(data.cart))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function changeQuantity(itemId: string, quantity: number) {
    setUpdatingId(itemId);
    try {
      if (quantity <= 0) {
        await apiFetch(`/api/mobile/cart/items/${itemId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/mobile/cart/items/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        });
      }
      load();
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);

  return (
    <View className="flex-1 bg-cream">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 p-4 pb-24"
        ListEmptyComponent={
          <Text className="mt-8 text-center text-navy/60">Seu carrinho está vazio.</Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
            <Image source={{ uri: item.product.imageUrl }} className="h-14 w-14 rounded-xl" />
            <View className="flex-1">
              <Text className="font-semibold text-navy">{item.product.name}</Text>
              <Text className="text-navy/60">{formatPrice(item.product.priceCents)}</Text>
            </View>
            <Pressable
              disabled={updatingId === item.id}
              onPress={() => changeQuantity(item.id, item.quantity - 1)}
              className="h-8 w-8 items-center justify-center rounded-full bg-navy/5"
            >
              <Text className="text-lg text-navy">−</Text>
            </Pressable>
            <Text className="w-5 text-center text-navy">{item.quantity}</Text>
            <Pressable
              disabled={updatingId === item.id}
              onPress={() => changeQuantity(item.id, item.quantity + 1)}
              className="h-8 w-8 items-center justify-center rounded-full bg-navy/5"
            >
              <Text className="text-lg text-navy">+</Text>
            </Pressable>
          </View>
        )}
      />
      {items.length > 0 && (
        <View className="border-t border-navy/10 bg-card p-4">
          <View className="flex-row justify-between">
            <Text className="text-lg font-semibold text-navy">Total</Text>
            <Text className="text-lg font-semibold text-navy">{formatPrice(total)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
