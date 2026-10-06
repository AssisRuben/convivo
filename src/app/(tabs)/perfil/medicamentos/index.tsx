import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { invalidateCached } from "@/lib/tabDataCache";
import { HOME_CACHE_KEY, ROTINA_CACHE_KEY } from "@/lib/tabPrefetch";

type ApiMedicationTracking = {
  id: string;
  productName: string;
  codigoProduto: number | null;
  purchaseDate: string;
  /** "Comecei a tomar em" (ausente em servidor antigo). */
  startDate?: string;
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  /** null = uso contínuo (ausente em servidor antigo). */
  treatmentDays?: number | null;
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
  const [addOpen, setAddOpen] = useState(false);

  // Duas portas de entrada: escolher numa compra feita na farmácia (já vem
  // nome e quantidade) ou digitar o nome — remédio comprado em outro lugar
  // não tinha como ser cadastrado antes.
  function chooseAdd(path: "/perfil/historico-compras" | "/perfil/medicamentos/novo") {
    setAddOpen(false);
    router.push(path);
  }

  const addButton = (
    <Pressable
      onPress={() => setAddOpen(true)}
      className="flex-row items-center justify-center gap-2 rounded-full bg-mint py-3"
    >
      <Ionicons name="add-circle" size={18} color="#fff" />
      <Text className="font-semibold text-white">Adicionar remédio</Text>
    </Pressable>
  );

  const addSheet = (
    <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setAddOpen(false)}>
        <Pressable className="gap-2 rounded-t-3xl bg-cream p-5 pb-10" onPress={() => {}}>
          <Text className="mb-1 text-center text-base font-bold text-navy">Adicionar remédio</Text>
          <Pressable
            onPress={() => chooseAdd("/perfil/historico-compras")}
            className="flex-row items-center gap-3 rounded-2xl bg-card p-4"
          >
            <Ionicons name="receipt-outline" size={22} color="#0b1e3d" />
            <View className="flex-1">
              <Text className="text-base font-medium text-navy">Escolher das minhas compras</Text>
              <Text className="text-xs text-navy/50">Comprou aqui na farmácia? Já vem com nome e quantidade.</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => chooseAdd("/perfil/medicamentos/novo")}
            className="flex-row items-center gap-3 rounded-2xl bg-card p-4"
          >
            <Ionicons name="create-outline" size={22} color="#0b1e3d" />
            <View className="flex-1">
              <Text className="text-base font-medium text-navy">Digitar o nome</Text>
              <Text className="text-xs text-navy/50">Pra remédio comprado em outro lugar.</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => setAddOpen(false)} className="mt-1 items-center rounded-full py-3">
            <Text className="text-sm font-semibold text-navy/60">Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
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
            if (res.ok) {
              setItems(data.items ?? []);
              // os horários dele saem da Home e da Rotina
              invalidateCached(HOME_CACHE_KEY);
              invalidateCached(ROTINA_CACHE_KEY);
            }
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
    <>
    <FlatList
      className="flex-1 bg-cream"
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-4 pb-24"
      ListHeaderComponent={items.length > 0 ? addButton : null}
      ListEmptyComponent={
        <View className="mt-6 gap-4 rounded-2xl bg-card p-5">
          <View className="items-center gap-2">
            <Ionicons name="medkit" size={32} color="#2ec4b6" />
            <Text className="text-center text-base font-semibold text-navy">
              Cadastre seu remédio
            </Text>
            <Text className="text-center text-sm text-navy/60">
              O app lembra na hora de tomar, mostra as doses do dia na tela inicial e avisa
              antes de acabar.
            </Text>
          </View>
          {addButton}
        </View>
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
                <Text className="mt-0.5 text-xs text-navy/50">
                  {item.treatmentDays
                    ? `Tratamento de ${item.treatmentDays} dia${item.treatmentDays > 1 ? "s" : ""}`
                    : "Uso contínuo"}
                  {item.startDate ? ` · começou em ${formatDate(item.startDate)}` : ""}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/perfil/medicamentos/[id]/editar", params: { id: item.id } })
                }
                disabled={busyId === item.id}
                accessibilityLabel="Editar medicamento"
                hitSlop={12}
                className="p-2.5"
              >
                <Ionicons name="create-outline" size={16} color="#0b1e3d" />
              </Pressable>
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

            {/* Cadastrado à mão (sem produto da farmácia vinculado) não tem
                recompra rápida — o servidor recusaria. */}
            {item.codigoProduto != null && (
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
            )}
          </View>
        );
      }}
    />
    {addSheet}
    </>
  );
}
