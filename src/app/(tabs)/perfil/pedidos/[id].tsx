import { useCallback, useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";

type ApiOrderItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  product: { name: string };
};

type ApiPaymentMethod = "ONLINE_MP" | "CARTAO_PRESENCIAL" | "DINHEIRO";

type ApiOrderDetail = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  subtotalCents: number;
  totalCents: number;
  walletDiscountCents: number;
  paymentMethod: ApiPaymentMethod;
  cashTenderedCents: number | null;
  trierError: string | null;
  mpError: string | null;
  items: ApiOrderItem[];
};

const STATUS_LABEL: Record<ApiOrderDetail["status"], string> = {
  PENDING: "Pagamento pendente",
  APPROVED: "Pagamento aprovado",
  REJECTED: "Pagamento rejeitado",
};

const PAYMENT_METHOD_LABEL: Record<ApiPaymentMethod, string> = {
  ONLINE_MP: "Mercado Pago",
  CARTAO_PRESENCIAL: "Cartão na loja",
  DINHEIRO: "Dinheiro",
};

const STATUS_COLOR: Record<ApiOrderDetail["status"], string> = {
  PENDING: "text-amber-600",
  APPROVED: "text-mint",
  REJECTED: "text-coral",
};

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrderDetail | null>(null);
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(() => {
    apiFetch(`/api/mobile/pedidos/${id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.order ?? null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function simulatePayment() {
    setSimulating(true);
    try {
      const res = await apiFetch(`/api/mobile/pedidos/${id}/simular-pagamento`, {
        method: "POST",
      });
      if (res.ok) load();
    } finally {
      setSimulating(false);
    }
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-24">
      <Text className="mb-1 text-xl font-bold text-navy">Pedido #{order.id.slice(-8)}</Text>
      <Text className={`mb-4 font-medium ${STATUS_COLOR[order.status]}`}>
        {STATUS_LABEL[order.status]}
      </Text>

      <View className="rounded-2xl bg-card p-4 shadow-sm">
        {order.items.map((item) => (
          <View key={item.id} className="mb-2 flex-row justify-between">
            <Text className="flex-1 text-sm text-navy">
              {item.quantity}x {item.product.name}
            </Text>
            <Text className="text-sm text-navy">
              {formatPrice(item.unitPriceCents * item.quantity)}
            </Text>
          </View>
        ))}
        <View className="mt-2 flex-row justify-between border-t border-navy/10 pt-2">
          <Text className="text-navy/70">Subtotal</Text>
          <Text className="text-navy/70">{formatPrice(order.subtotalCents)}</Text>
        </View>
        {order.walletDiscountCents > 0 && (
          <View className="mt-1 flex-row justify-between">
            <Text className="text-coral">Desconto (saldo)</Text>
            <Text className="text-coral">-{formatPrice(order.walletDiscountCents)}</Text>
          </View>
        )}
        <View className="mt-1 flex-row justify-between">
          <Text className="font-semibold text-navy">Total</Text>
          <Text className="font-semibold text-navy">{formatPrice(order.totalCents)}</Text>
        </View>
      </View>

      <View className="mt-3 rounded-2xl bg-card p-4 shadow-sm">
        <View className="flex-row justify-between">
          <Text className="text-navy/70">Forma de pagamento</Text>
          <Text className="text-navy">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</Text>
        </View>
        {order.paymentMethod === "DINHEIRO" && order.cashTenderedCents != null && (
          <View className="mt-1 flex-row justify-between">
            <Text className="text-navy/70">Troco</Text>
            <Text className="text-navy">
              {formatPrice(order.cashTenderedCents - order.totalCents)} (pago com{" "}
              {formatPrice(order.cashTenderedCents)})
            </Text>
          </View>
        )}
      </View>

      {order.status === "REJECTED" && Boolean(order.mpError) && (
        <View className="mt-4 rounded-2xl bg-coral/10 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="close-circle-outline" size={18} color="#e63946" />
            <Text className="flex-1 text-sm font-medium text-coral">Pagamento não foi concluído</Text>
          </View>
          <Text className="mt-1 text-xs text-navy/60">{order.mpError}</Text>
        </View>
      )}

      {order.status === "APPROVED" && Boolean(order.trierError) && (
        <View className="mt-4 rounded-2xl bg-coral/10 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle-outline" size={18} color="#e63946" />
            <Text className="flex-1 text-sm font-medium text-coral">
              Esse pedido ainda não foi registrado na farmácia
            </Text>
          </View>
          <Text className="mt-1 text-xs text-navy/60">{order.trierError}</Text>
          {order.trierError?.includes("CPF") && (
            <Link href="/perfil/meus-dados" className="mt-2 text-xs font-medium text-mint">
              Completar CPF em Meus dados →
            </Link>
          )}
        </View>
      )}

      {order.status === "PENDING" && (
        <>
          <Text className="mt-4 text-sm text-navy/60">
            Assim que o Mercado Pago confirmar o pagamento, o status deste pedido é atualizado
            automaticamente.
            {order.walletDiscountCents > 0 &&
              " O desconto de saldo mostrado é o combinado — o valor final é confirmado junto com o pagamento."}
          </Text>
          <Pressable
            disabled={simulating}
            onPress={simulatePayment}
            className="mt-4 items-center rounded-full bg-amber-500 py-3.5"
          >
            {simulating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-semibold text-white">
                Simular confirmação do Mercado Pago (modo de teste)
              </Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
