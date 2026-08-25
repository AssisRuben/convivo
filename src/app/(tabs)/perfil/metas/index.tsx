import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiGoal, type ApiGoalMetric, type ApiGoalStatus } from "@/lib/api";

const METRIC_META: Record<ApiGoalMetric, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  PESO: { icon: "trending-down-outline", label: "Peso" },
  PRESSAO: { icon: "pulse-outline", label: "Pressão" },
  ROTINA: { icon: "repeat-outline", label: "Rotina" },
};

const STATUS_META: Record<ApiGoalStatus, { label: string; bgClass: string; textClass: string }> = {
  ACTIVE: { label: "Em andamento", bgClass: "bg-mint/15", textClass: "text-mint" },
  COMPLETED: { label: "Concluída", bgClass: "bg-[#f59e0b]/15", textClass: "text-[#b45309]" },
  EXPIRED: { label: "Prazo encerrado", bgClass: "bg-navy/10", textClass: "text-navy/50" },
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function MetasScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<ApiGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/metas");
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals ?? []);
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
      data={goals}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-4 pb-24"
      ListHeaderComponent={
        <Pressable
          onPress={() => router.push("/perfil/metas/nova")}
          className="mb-1 flex-row items-center justify-center gap-1.5 rounded-full bg-navy py-3"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="font-semibold text-white">Nova meta</Text>
        </Pressable>
      }
      ListEmptyComponent={
        <Text className="mt-8 text-center text-navy/60">
          Nenhuma meta cadastrada ainda — declare um objetivo com prazo e receba dicas ao longo do
          caminho.
        </Text>
      }
      renderItem={({ item }) => {
        const metric = METRIC_META[item.metric];
        const status = STATUS_META[item.status];
        const daysLeft = Math.max(0, item.daysTotal - item.daysElapsed);

        return (
          <Pressable
            onPress={() => router.push({ pathname: "/perfil/metas/[id]", params: { id: item.id } })}
            className="rounded-2xl bg-card p-4 shadow-sm"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row items-center gap-2 pr-2">
                <Ionicons name={metric.icon} size={18} color="#0b1e3d80" />
                <Text className="flex-1 font-semibold text-navy">{item.title}</Text>
              </View>
              <View className={`rounded-full px-2.5 py-1 ${status.bgClass}`}>
                <Text className={`text-[10px] font-semibold ${status.textClass}`}>
                  {status.label}
                </Text>
              </View>
            </View>

            {item.progressRatio != null && (
              <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-navy/5">
                <View
                  className="h-full rounded-full bg-mint"
                  style={{ width: `${Math.round(item.progressRatio * 100)}%` }}
                />
              </View>
            )}

            <Text className="mt-2 text-xs text-navy/60">{item.progressLabel}</Text>
            <Text className="mt-1 text-[11px] text-navy/40">
              {item.status === "ACTIVE"
                ? `Faltam ${daysLeft} dia(s) · prazo ${formatDate(item.endDate)}`
                : `Prazo: ${formatDate(item.endDate)}`}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}
