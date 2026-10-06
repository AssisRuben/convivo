import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
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
  /** Quanto deve restar hoje (ausente em servidor antigo). */
  unitsRemaining?: number;
  packQuantity?: number;
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

function invalidateDoseScreens() {
  // horários/estoque mudam a Home e a Rotina — as duas buscam de novo na
  // próxima vez que ganharem foco
  invalidateCached(HOME_CACHE_KEY);
  invalidateCached(ROTINA_CACHE_KEY);
}

export default function MedicamentosScreen() {
  const router = useRouter();
  // Vindo do "Comprei mais" da Home: abre direto o campo de quantidade.
  const { comprei } = useLocalSearchParams<{ comprei?: string }>();
  const [items, setItems] = useState<ApiMedicationTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stockFor, setStockFor] = useState<ApiMedicationTracking | null>(null);
  const [stockUnits, setStockUnits] = useState("");
  const [savingStock, setSavingStock] = useState(false);

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
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!comprei || loading) return;
    const item = items.find((i) => i.id === comprei);
    if (item) openStock(item);
    router.setParams({ comprei: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comprei, loading]);

  function openStock(item: ApiMedicationTracking) {
    setStockFor(item);
    setStockUnits("");
  }

  async function saveStock() {
    if (!stockFor) return;
    const units = Number(stockUnits);
    if (!Number.isInteger(units) || units <= 0) {
      showAlert(
        "Quantidade inválida",
        "Informe quantos comprimidos (ou unidades) você comprou",
      );
      return;
    }
    setSavingStock(true);
    try {
      const res = await apiFetch(
        `/api/mobile/medicamentos/${stockFor.id}/estoque`,
        {
          method: "POST",
          body: JSON.stringify({ units }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
      setItems(data.items ?? []);
      invalidateDoseScreens();
      setStockFor(null);
    } catch (error) {
      showAlert(
        "Erro ao salvar",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setSavingStock(false);
    }
  }

  function handleRemove(item: ApiMedicationTracking) {
    showAlert(
      "Parar de acompanhar",
      `Remover "${item.productName}" da lista?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setBusyId(item.id);
            try {
              const res = await apiFetch(
                `/api/mobile/medicamentos/${item.id}`,
                {
                  method: "DELETE",
                },
              );
              const data = await res.json();
              if (res.ok) {
                setItems(data.items ?? []);
                invalidateDoseScreens();
              }
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const addButton = (
    <Pressable
      onPress={() => router.push("/perfil/medicamentos/novo")}
      className="flex-row items-center justify-center gap-2 rounded-full bg-mint py-3"
    >
      <Ionicons name="add-circle" size={18} color="#fff" />
      <Text className="font-semibold text-white">Adicionar remédio</Text>
    </Pressable>
  );

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
                O app lembra na hora de tomar, mostra as doses do dia na tela
                inicial e avisa antes de acabar.
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
                  <Text className="font-semibold text-navy">
                    {item.productName}
                  </Text>
                  <Text className="mt-0.5 text-xs text-navy/50">
                    {item.horarios.join(" · ")} — {item.unitsPerDose} por vez
                  </Text>
                  <Text className="mt-0.5 text-xs text-navy/50">
                    {item.treatmentDays
                      ? `Tratamento de ${item.treatmentDays} dia${item.treatmentDays > 1 ? "s" : ""}`
                      : "Uso contínuo"}
                    {item.startDate
                      ? ` · começou em ${formatDate(item.startDate)}`
                      : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/perfil/medicamentos/[id]/editar",
                      params: { id: item.id },
                    })
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
                <Text
                  className={`flex-1 text-xs font-medium ${low ? "text-coral" : "text-navy/70"}`}
                >
                  {item.daysUntilRunOut <= 0
                    ? "Já deve ter acabado — use “Comprei mais” se repôs"
                    : `Restam ~${item.unitsRemaining ?? "?"} · acaba em ~${item.daysUntilRunOut} dia(s), ${formatDate(item.estimatedRunOutDate)}`}
                </Text>
              </View>

              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() => openStock(item)}
                  className="flex-1 items-center rounded-full border border-navy/15 py-2.5"
                >
                  <Text className="text-sm font-semibold text-navy">
                    Comprei mais
                  </Text>
                </Pressable>
                {/* Recompra rápida só com produto da farmácia vinculado —
                    remédio digitado à mão não tem como ser recomprado. */}
                {item.codigoProduto != null && (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/perfil/medicamentos/[id]/recomprar",
                        params: { id: item.id },
                      })
                    }
                    className="flex-1 items-center rounded-full bg-navy py-2.5"
                  >
                    <Text className="text-sm font-semibold text-white">
                      Recomprar
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={stockFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setStockFor(null)}
      >
        {/* Campo na parte de baixo com teclado aberto: sem isso o teclado do
            Android cobre o campo (mesmo tratamento do OnboardingTour). */}
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable
            className="flex-1 justify-end bg-black/40"
            onPress={() => setStockFor(null)}
          >
            <Pressable
              className="gap-3 rounded-t-3xl bg-cream p-5 pb-10"
              onPress={() => {}}
            >
              <Text className="text-base font-bold text-navy">
                Comprei mais
              </Text>
              <Text className="text-sm text-navy/60">
                {stockFor?.productName}
              </Text>
              <TextInput
                value={stockUnits}
                onChangeText={setStockUnits}
                keyboardType="number-pad"
                placeholder="Quantos comprimidos (ou unidades) comprou?"
                autoFocus
                className="rounded-xl border border-navy/10 bg-card p-3"
              />
              <Text className="text-xs text-navy/50">
                Somamos ao que você ainda deve ter (~
                {stockFor?.unitsRemaining ?? 0}). O aviso de “acabando” volta a
                valer pela nova quantidade.
              </Text>
              <Pressable
                disabled={savingStock}
                onPress={saveStock}
                className="items-center rounded-full bg-navy py-3.5 disabled:opacity-50"
              >
                {savingStock ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">Salvar</Text>
                )}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
