import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiHomeDashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useProfileDrawer } from "@/lib/profileDrawer";
import { showAlert } from "@/lib/alert";
import { HOME_CACHE_KEY, fetchHomeDashboard } from "@/lib/tabPrefetch";
import { getCached, loadCached, setCached } from "@/lib/tabDataCache";

function readCachedDashboard() {
  return getCached<ApiHomeDashboard>(HOME_CACHE_KEY);
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstName(fullName: string | undefined): string {
  return fullName?.split(" ")[0] ?? "";
}

function QuickAction({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-2xl bg-card p-4 shadow-sm"
    >
      <View>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-navy/5">
          <Ionicons name={icon} size={20} color="#0b1e3d" />
        </View>
        {Boolean(badge) && (
          <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-coral">
            <Text className="text-[9px] font-bold text-white">{badge}</Text>
          </View>
        )}
      </View>
      <Text className="text-xs font-medium text-navy">{label}</Text>
    </Pressable>
  );
}

/**
 * Home vira um dashboard (próxima dose, recompra rápida, fidelidade,
 * ações rápidas) em vez do feed que morava aqui antes — o feed
 * (conquistas/comunidade) mudou pra Perfil > Novidades. Cada seção some
 * sozinha quando não tem dado (sem medicamento cadastrado, nada perto de
 * acabar) em vez de mostrar card vazio.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { open: openProfileDrawer } = useProfileDrawer();
  const [dashboard, setDashboard] = useState<ApiHomeDashboard | null>(() => readCachedDashboard() ?? null);
  const [loading, setLoading] = useState(() => readCachedDashboard() === undefined);
  const [marking, setMarking] = useState(false);
  const loadedOnce = useRef(false);
  const hadCacheOnMount = useRef(readCachedDashboard() !== undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCached(HOME_CACHE_KEY, fetchHomeDashboard);
      setDashboard(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      if (hadCacheOnMount.current) return; // já veio do cache/prefetch
      load();
    }, [load])
  );

  // Espelha o state atual no cache — cobre a carga inicial e qualquer
  // mutação (marcar dose), sem precisar sincronizar em cada handler.
  useEffect(() => {
    if (!loading && dashboard) setCached(HOME_CACHE_KEY, dashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard]);

  async function markDoseTaken() {
    if (!dashboard?.nextDose || marking) return;
    setMarking(true);
    try {
      const res = await apiFetch(`/api/mobile/rotina/${dashboard.nextDose.checklistItemId}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      // Fetch direto, não `load()` — esse já leu do cache e devolveria o
      // estado antigo (loadCached nunca refaz a busca se já tem valor).
      setDashboard(await fetchHomeDashboard());
    } catch {
      showAlert("Erro", "Não foi possível marcar a dose como tomada.");
    } finally {
      setMarking(false);
    }
  }

  // recomprar+api.ts cria o pedido de verdade (exige forma de pagamento) —
  // não dá pra disparar direto daqui sem esses dados. "Recompra Rápida" na
  // Home é a porta de entrada mais curta pra tela que já resolve isso
  // (perfil/medicamentos/[id]/recomprar.tsx), não uma compra em 1 toque.
  function quickRepurchase(medicationTrackingId: string) {
    router.push({
      pathname: "/perfil/medicamentos/[id]/recomprar",
      params: { id: medicationTrackingId },
    });
  }

  if (loading || !dashboard) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-4 p-4 pb-24">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-navy/10">
            <Ionicons name="person" size={22} color="#0b1e3d" />
          </View>
          <View>
            <Text className="text-sm text-navy/60">Olá,</Text>
            <Text className="text-lg font-bold text-navy">{firstName(user?.name)}.</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/perfil/novidades")}>
            <Ionicons name="notifications-outline" size={24} color="#0b1e3d" />
          </Pressable>
          <Pressable onPress={openProfileDrawer}>
            <Ionicons name="person-outline" size={24} color="#0b1e3d" />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/(tabs)/catalogo")}
        className="flex-row items-center gap-2 rounded-2xl bg-card p-3.5 shadow-sm"
      >
        <Ionicons name="search-outline" size={18} color="#0b1e3d60" />
        <Text className="text-navy/50">Buscar remédios e produtos...</Text>
      </Pressable>

      {dashboard.nextDose && (
        <View className="gap-3 rounded-2xl bg-mint/10 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="calendar-outline" size={14} color="#2ec4b6" />
              <Text className="text-xs font-semibold text-mint">
                {dashboard.nextDose.overdue ? "Dose atrasada" : "Próxima dose"}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={14} color="#0b1e3d80" />
              <Text className="text-xs text-navy/60">{dashboard.nextDose.timeOfDay}</Text>
            </View>
          </View>
          <Text className="text-lg font-bold text-navy">{dashboard.nextDose.title}</Text>
          <Pressable
            disabled={marking}
            onPress={markDoseTaken}
            className="flex-row items-center justify-center gap-2 rounded-full bg-mint p-3 disabled:opacity-50"
          >
            {marking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text className="font-semibold text-white">Marcar como Tomado</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {dashboard.repurchaseReady.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-navy">Meus Medicamentos</Text>
            <Text className="text-xs text-navy/50">(Prontos para recompra)</Text>
          </View>
          {dashboard.repurchaseReady.map((med) => (
            <View
              key={med.medicationTrackingId}
              className="flex-row items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-navy/5">
                <Ionicons name="medkit-outline" size={20} color="#0b1e3d" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-navy">{med.productName}</Text>
                <Text className="text-xs text-navy/50">
                  {med.daysUntilRunOut <= 0
                    ? "Já deve ter acabado"
                    : `Acaba em ${med.daysUntilRunOut} dia${med.daysUntilRunOut > 1 ? "s" : ""}`}
                </Text>
              </View>
              <Pressable
                onPress={() => quickRepurchase(med.medicationTrackingId)}
                className="rounded-full bg-mint px-4 py-2.5"
              >
                <Text className="text-xs font-semibold text-white">Recompra Rápida</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => router.push("/perfil/fidelidade")}
        className="flex-row items-center gap-3 rounded-2xl bg-card p-4 shadow-sm"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-navy/5">
          <Ionicons name="star" size={20} color="#0b1e3d" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-navy">Cartão Fidelidade</Text>
          <Text className="text-xs text-navy/50">
            {dashboard.loyalty.stampsFilled} de {dashboard.loyalty.stampsTotal} selos ·{" "}
            {formatPrice(dashboard.loyalty.totalRewardCents)} em benefícios
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#0b1e3d60" />
      </Pressable>

      <View className="gap-2">
        <Text className="text-base font-bold text-navy">Ações Rápidas</Text>
        <View className="flex-row gap-3">
          <QuickAction
            icon="star-outline"
            label="Pontos"
            onPress={() => router.push("/perfil/fidelidade")}
          />
          <QuickAction
            icon="pricetag-outline"
            label="Ofertas"
            badge={dashboard.activePromotionsCount || undefined}
            onPress={() => router.push("/ofertas")}
          />
          <QuickAction
            icon="newspaper-outline"
            label="Notícia"
            onPress={() => router.push("/perfil/novidades")}
          />
          <QuickAction
            icon="medkit-outline"
            label="Recompra"
            onPress={() => router.push("/perfil/medicamentos")}
          />
        </View>
      </View>
    </ScrollView>
  );
}
