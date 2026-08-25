import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch, type ApiCart } from "@/lib/api";
import { showAlert } from "@/lib/alert";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "12,50" ou "12.50" → 1250. Entrada inválida/vazia vira 0. */
function parseReaisToCents(text: string): number {
  const normalized = text.replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0;
}

export default function CarrinhoScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<ApiCart | null>(null);
  const [saldoCents, setSaldoCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [discountInput, setDiscountInput] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/mobile/cart").then((res) => res.json()),
      apiFetch("/api/mobile/wallet").then((res) => res.json()),
    ])
      .then(([cartData, walletData]) => {
        setCart(cartData.cart);
        setSaldoCents(walletData.saldoCents ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  const maxDiscountCents = Math.min(saldoCents, total);
  // Clamp é só pra um preview honesto na tela — o servidor recalcula e
  // trava o valor de qualquer forma (nunca confia no que o cliente manda).
  const clampedDiscountCents = Math.min(
    Math.max(parseReaisToCents(discountInput), 0),
    maxDiscountCents
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

  async function finishOrder() {
    setFinishing(true);
    try {
      const res = await apiFetch("/api/mobile/pedidos", {
        method: "POST",
        body: JSON.stringify({ walletDiscountCents: clampedDiscountCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert("Não foi possível fechar o pedido", data.error ?? "Tente novamente");
        return;
      }
      router.push({ pathname: "/perfil/pedidos/[id]", params: { id: data.order.id } });
    } finally {
      setFinishing(false);
    }
  }

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
          <View className="mb-3 flex-row justify-between">
            <Text className="text-navy/70">Subtotal</Text>
            <Text className="text-navy/70">{formatPrice(total)}</Text>
          </View>

          {maxDiscountCents > 0 && (
            <View className="mb-3">
              <Text className="mb-1 text-xs text-navy/50">
                Saldo disponível: {formatPrice(saldoCents)}
              </Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={discountInput}
                  onChangeText={setDiscountInput}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  className="flex-1 rounded-xl border border-navy/10 bg-cream p-2.5"
                />
                <Pressable
                  onPress={() =>
                    setDiscountInput((maxDiscountCents / 100).toFixed(2).replace(".", ","))
                  }
                  className="rounded-xl bg-mint/15 px-3 py-2.5"
                >
                  <Text className="text-sm font-medium text-mint">Usar máximo</Text>
                </Pressable>
              </View>
            </View>
          )}

          {clampedDiscountCents > 0 && (
            <View className="mb-3 flex-row justify-between">
              <Text className="text-coral">Desconto (saldo)</Text>
              <Text className="text-coral">-{formatPrice(clampedDiscountCents)}</Text>
            </View>
          )}

          <View className="mb-3 flex-row justify-between border-t border-navy/5 pt-3">
            <Text className="text-lg font-semibold text-navy">Total</Text>
            <Text className="text-lg font-semibold text-navy">
              {formatPrice(total - clampedDiscountCents)}
            </Text>
          </View>
          <Pressable
            disabled={finishing}
            onPress={finishOrder}
            className="items-center rounded-full bg-navy py-3.5"
          >
            {finishing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-semibold text-white">Finalizar pedido (retirada)</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
