import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiWisdomProgress } from "@/lib/api";
import { getWisdomTopic } from "@/constants/wisdomPills";

type ChapterStatus = "read" | "available" | "waiting" | "locked";

function statusFor(number: number, progress: ApiWisdomProgress): ChapterStatus {
  if (number <= progress.chaptersRead) return "read";
  if (number === progress.chaptersRead + 1) {
    return progress.nextChapterAvailable ? "available" : "waiting";
  }
  return "locked";
}

const STATUS_META: Record<
  ChapterStatus,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  read: { icon: "checkmark-circle", color: "#2ec4b6", label: "Lido" },
  available: { icon: "sparkles-outline", color: "#e63946", label: "Disponível hoje" },
  waiting: { icon: "time-outline", color: "#0b1e3d60", label: "Disponível amanhã" },
  locked: { icon: "lock-closed-outline", color: "#0b1e3d40", label: "Bloqueado" },
};

export default function PilulasSabedoriaTopicoScreen() {
  const router = useRouter();
  const { topico } = useLocalSearchParams<{ topico: string }>();
  const topic = getWisdomTopic(topico);

  const [progress, setProgress] = useState<ApiWisdomProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/mobile/wisdom/${topico}`);
      if (res.ok) setProgress(await res.json());
    } finally {
      setLoading(false);
    }
  }, [topico]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!topic) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-cream p-6">
        <Text className="text-center text-navy/60">Tópico não encontrado.</Text>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/perfil/pilulas-sabedoria"))}
          className="rounded-full bg-navy px-5 py-2.5"
        >
          <Text className="text-sm font-semibold text-white">Voltar</Text>
        </Pressable>
      </View>
    );
  }

  if (loading || !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-cream"
      data={topic.chapters}
      keyExtractor={(item) => String(item.number)}
      contentContainerClassName="gap-3 p-4 pb-24"
      ListHeaderComponent={
        <View className="mb-1 flex-row items-center gap-3 rounded-2xl bg-navy p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Ionicons name={topic.icon as keyof typeof Ionicons.glyphMap} size={22} color="#fde68a" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">{topic.title}</Text>
            <Text className="mt-0.5 text-xs text-white/60">
              {progress.chaptersRead} de {progress.totalChapters} capítulos lidos
            </Text>
            <Text className="mt-0.5 text-xs text-white/60">
              {progress.streakDays > 0
                ? `🔥 ${progress.streakDays} dia${progress.streakDays > 1 ? "s seguidos" : " seguido"}`
                : "Leia um capítulo por dia pra começar sua sequência"}
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const status = statusFor(item.number, progress);
        const meta = STATUS_META[status];
        const disabled = status === "waiting" || status === "locked";

        return (
          <Pressable
            disabled={disabled}
            onPress={() =>
              router.push({
                pathname: "/perfil/pilulas-sabedoria/[topico]/capitulo/[numero]",
                params: { topico, numero: String(item.number) },
              })
            }
            className={`flex-row items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ${
              disabled ? "opacity-60" : ""
            }`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-navy/5">
              <Text className="text-xs font-bold text-navy/60">{item.number}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-navy">{item.title}</Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Ionicons name={meta.icon} size={13} color={meta.color} />
                <Text className="text-xs" style={{ color: meta.color }}>
                  {meta.label}
                </Text>
              </View>
            </View>
            {!disabled && <Ionicons name="chevron-forward" size={16} color="#0b1e3d60" />}
          </Pressable>
        );
      }}
    />
  );
}
