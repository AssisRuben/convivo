import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";

type ApiOrderItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  product: { name: string };
};

type ApiOrderDetail = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalCents: number;
  items: ApiOrderItem[];
};

const STATUS_LABEL: Record<ApiOrderDetail["status"], string> = {
  PENDING: "Pagamento pendente",
  APPROVED: "Pagamento aprovado",
  REJECTED: "Pagamento rejeitado",
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

  useEffect(() => {
    apiFetch(`/api/mobile/pedidos/${id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.order ?? null));
  }, [id]);

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
          <Text className="font-semibold text-navy">Total</Text>
          <Text className="font-semibold text-navy">{formatPrice(order.totalCents)}</Text>
        </View>
      </View>

      {order.status === "PENDING" && (
        <Text className="mt-4 text-sm text-navy/60">
          Assim que o pagamento for confirmado, o status deste pedido é atualizado
          automaticamente.
        </Text>
      )}
    </ScrollView>
  );
}
