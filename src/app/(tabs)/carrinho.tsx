import { useCallback, useState } from "react";
import { Link, useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { apiFetch, type ApiCart } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { FulfillmentAddressForm } from "@/components/checkout/FulfillmentAddressForm";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";

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
  const form = useCheckoutForm();
  const [cart, setCart] = useState<ApiCart | null>(null);
  const [saldoCents, setSaldoCents] = useState(0);
  const [hasCpf, setHasCpf] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [discountInput, setDiscountInput] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/mobile/cart").then((res) => res.json()),
      apiFetch("/api/mobile/wallet").then((res) => res.json()),
      apiFetch("/api/mobile/profile").then((res) => res.json()),
      form.loadMercadoPagoAvailability(),
    ])
      .then(([cartData, walletData, profileData]) => {
        setCart(cartData.cart);
        setSaldoCents(walletData.saldoCents ?? 0);
        setHasCpf(Boolean(profileData.profile?.cpf));
        form.applyProfileDefaults(profileData.profile);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const totalCents = total - clampedDiscountCents;

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
    const validationError = form.validate(totalCents);
    if (validationError) {
      showAlert("Verifique os dados", validationError);
      return;
    }

    setFinishing(true);
    try {
      const res = await apiFetch("/api/mobile/pedidos", {
        method: "POST",
        body: JSON.stringify(form.toRequestBody(clampedDiscountCents)),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert("Não foi possível fechar o pedido", data.error ?? "Tente novamente");
        return;
      }

      if (data.checkoutUrl) {
        await WebBrowser.openAuthSessionAsync(
          data.checkoutUrl,
          Linking.createURL(`perfil/pedidos/${data.order.id}`)
        );
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
        ListHeaderComponent={
          !hasCpf && items.length > 0 ? (
            <Link href="/perfil/meus-dados" asChild>
              <Pressable className="mb-1 flex-row items-center gap-2 rounded-2xl bg-coral/10 p-3">
                <Ionicons name="alert-circle-outline" size={18} color="#e63946" />
                <Text className="flex-1 text-xs font-medium text-coral">
                  Falta seu CPF pra farmácia registrar a compra — toque pra completar em Meus dados.
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#e63946" />
              </Pressable>
            </Link>
          ) : null
        }
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
        ListFooterComponent={
          items.length > 0 ? (
            <View className="mt-3 gap-3">
              <View className="rounded-2xl bg-card p-4 shadow-sm">
                <View className="flex-row justify-between">
                  <Text className="text-navy/70">Subtotal</Text>
                  <Text className="text-navy/70">{formatPrice(total)}</Text>
                </View>

                {maxDiscountCents > 0 && (
                  <View className="mt-3">
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
                  <View className="mt-3 flex-row justify-between">
                    <Text className="text-coral">Desconto (saldo)</Text>
                    <Text className="text-coral">-{formatPrice(clampedDiscountCents)}</Text>
                  </View>
                )}

                <View className="mt-3 flex-row justify-between border-t border-navy/5 pt-3">
                  <Text className="text-lg font-semibold text-navy">Total</Text>
                  <Text className="text-lg font-semibold text-navy">{formatPrice(totalCents)}</Text>
                </View>
              </View>

              <FulfillmentAddressForm form={form} />
              <PaymentMethodSelector form={form} totalCents={totalCents} />

              <Pressable
                disabled={finishing}
                onPress={finishOrder}
                className="items-center rounded-full bg-navy py-3.5 disabled:opacity-50"
              >
                {finishing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">
                    {form.fulfillmentType === "DELIVERY" ? "Finalizar pedido (entrega)" : "Finalizar pedido (retirada)"}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}
