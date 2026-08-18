import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";

type ApiOrder = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalCents: number;
  createdAt: string;
};

const STATUS_LABEL: Record<ApiOrder["status"], string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

const STATUS_COLOR: Record<ApiOrder["status"], string> = {
  PENDING: "text-amber-600",
  APPROVED: "text-mint",
  REJECTED: "text-coral",
};

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PedidosScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/pedidos");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      load();
    }, [load])
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
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-4"
      ListEmptyComponent={
        <Text className="mt-8 text-center text-navy/60">Você ainda não fez nenhum pedido.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: "/pedidos/[id]", params: { id: item.id } })}
          className="flex-row items-center justify-between rounded-2xl bg-card p-4 shadow-sm"
        >
          <View>
            <Text className="font-medium text-navy">Pedido #{item.id.slice(-8)}</Text>
            <Text className="text-sm text-navy/60">
              {new Date(item.createdAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-semibold text-navy">{formatPrice(item.totalCents)}</Text>
            <Text className={`text-sm ${STATUS_COLOR[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}
