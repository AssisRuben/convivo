import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiGoalDetail, type ApiGoalStatus } from "@/lib/api";
import { showAlert } from "@/lib/alert";

const STATUS_META: Record<ApiGoalStatus, { label: string; bgClass: string; textClass: string }> = {
  ACTIVE: { label: "Em andamento", bgClass: "bg-mint/15", textClass: "text-mint" },
  COMPLETED: { label: "Concluída", bgClass: "bg-[#f59e0b]/15", textClass: "text-[#b45309]" },
  EXPIRED: { label: "Prazo encerrado", bgClass: "bg-navy/10", textClass: "text-navy/50" },
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function MetaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goal, setGoal] = useState<ApiGoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    apiFetch(`/api/mobile/metas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.goal) setGoal(data.goal);
        else setLoadError(true);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(load);

  function handleDelete() {
    if (!goal) return;
    showAlert("Cancelar meta", `Remover "${goal.title}"? Isso não apaga uma rotina já criada.`, [
      { text: "Voltar", style: "cancel" },
      {
        text: "Cancelar meta",
        style: "destructive",
        onPress: async () => {
          setRemoving(true);
          try {
            const res = await apiFetch(`/api/mobile/metas/${id}`, { method: "DELETE" });
            if (res.ok) router.replace("/perfil/metas");
          } finally {
            setRemoving(false);
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

  if (loadError || !goal) {
    return (
      <View className="flex-1 items-center justify-center bg-cream p-4">
        <Text className="text-center text-navy/60">Não foi possível carregar essa meta.</Text>
        <Pressable onPress={load} className="mt-4 rounded-full bg-navy px-5 py-2.5">
          <Text className="text-sm font-medium text-white">Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  const status = STATUS_META[goal.status];
  const daysLeft = Math.max(0, goal.daysTotal - goal.daysElapsed);

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-24">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-xl font-bold text-navy">{goal.title}</Text>
        <View className={`rounded-full px-2.5 py-1 ${status.bgClass}`}>
          <Text className={`text-[10px] font-semibold ${status.textClass}`}>{status.label}</Text>
        </View>
      </View>

      <View className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
        {goal.progressRatio != null && (
          <View className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-navy/5">
            <View
              className="h-full rounded-full bg-mint"
              style={{ width: `${Math.round(goal.progressRatio * 100)}%` }}
            />
          </View>
        )}
        <Text className="text-sm font-medium text-navy">{goal.progressLabel}</Text>
        <Text className="mt-1 text-xs text-navy/50">
          Início {formatDate(goal.startDate)} · Prazo {formatDate(goal.endDate)}
          {goal.status === "ACTIVE" && ` · faltam ${daysLeft} dia(s)`}
        </Text>
      </View>

      <Text className="mb-2 mt-6 text-sm font-semibold text-navy/70">
        Dicas recebidas ({goal.tipsSentCount})
      </Text>
      {goal.tips.length === 0 ? (
        <Text className="text-sm text-navy/50">
          Nenhuma dica enviada ainda — as primeiras chegam nos próximos dias.
        </Text>
      ) : (
        <View className="gap-2">
          {goal.tips.map((tip) => (
            <View key={tip.index} className="rounded-2xl bg-card p-4 shadow-sm">
              <Text className="text-sm text-navy/80">{tip.text}</Text>
              <Text className="mt-1.5 text-[11px] text-navy/40">{formatDateTime(tip.sentAt)}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        disabled={removing}
        onPress={handleDelete}
        className="mt-6 flex-row items-center justify-center gap-2 rounded-full bg-coral/10 py-3 disabled:opacity-50"
      >
        <Ionicons name="trash-outline" size={16} color="#e63946" />
        <Text className="text-sm font-medium text-coral">Cancelar meta</Text>
      </Pressable>
    </ScrollView>
  );
}
