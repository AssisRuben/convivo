import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";

type ApiMedicationTracking = {
  id: string;
  productName: string;
  codigoProduto: number | null;
  purchaseDate: string;
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  dosesTaken: number;
  estimatedRunOutDate: string;
  daysUntilRunOut: number;
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function MedicamentosScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ApiMedicationTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/medicamentos");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadedOnce.current = true;
      load();
    }, [load])
  );

  function handleRemove(item: ApiMedicationTracking) {
    showAlert("Parar de acompanhar", `Remover "${item.productName}" da lista?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setBusyId(item.id);
          try {
            const res = await apiFetch(`/api/mobile/medicamentos/${item.id}`, {
              method: "DELETE",
            });
            const data = await res.json();
            if (res.ok) setItems(data.items ?? []);
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

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
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-4 pb-24"
      ListEmptyComponent={
        <Text className="mt-8 text-center text-navy/60">
          Nenhum medicamento acompanhado ainda — toque numa compra em &ldquo;Histórico de
          compras&rdquo; pra começar.
        </Text>
      }
      renderItem={({ item }) => {
        const low = item.daysUntilRunOut <= 3;
        return (
          <View className="rounded-2xl bg-card p-4 shadow-sm">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-semibold text-navy">{item.productName}</Text>
                <Text className="mt-0.5 text-xs text-navy/50">
                  {item.horarios.join(" · ")} — {item.unitsPerDose}un/dose
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemove(item)}
                disabled={busyId === item.id}
                accessibilityLabel="Remover medicamento"
                hitSlop={12}
                className="p-2.5"
              >
                <Ionicons name="trash-outline" size={16} color="#e63946" />
              </Pressable>
            </View>

            <View
              className={`mt-3 flex-row items-center gap-2 rounded-xl p-2.5 ${
                low ? "bg-coral/10" : "bg-navy/5"
              }`}
            >
              <Ionicons
                name={low ? "alert-circle" : "time-outline"}
                size={16}
                color={low ? "#e63946" : "#0b1e3d80"}
              />
              <Text className={`flex-1 text-xs font-medium ${low ? "text-coral" : "text-navy/70"}`}>
                {item.daysUntilRunOut <= 0
                  ? "Já deve ter acabado"
                  : `Acaba em ~${item.daysUntilRunOut} dia(s) — ${formatDate(item.estimatedRunOutDate)}`}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/perfil/medicamentos/[id]/recomprar",
                  params: { id: item.id },
                })
              }
              className="mt-3 items-center rounded-full bg-navy py-2.5"
            >
              <Text className="text-sm font-semibold text-white">Confirmar compra</Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}
