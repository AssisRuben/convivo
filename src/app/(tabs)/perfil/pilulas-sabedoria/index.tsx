import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, SectionList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiWisdomProgress } from "@/lib/api";
import { WISDOM_CHAPTERS, WISDOM_TOPICS, type WisdomChapter, type WisdomTopic } from "@/constants/wisdomPills";

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

const SECTIONS: (WisdomTopic & { data: WisdomChapter[] })[] = WISDOM_TOPICS.map((topic) => ({
  ...topic,
  data: WISDOM_CHAPTERS.filter((c) => c.number >= topic.firstChapter && c.number <= topic.lastChapter),
}));

export default function PilulasSabedoriaScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ApiWisdomProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/wisdom");
      if (res.ok) setProgress(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <SectionList
      className="flex-1 bg-cream"
      sections={SECTIONS}
      keyExtractor={(item) => String(item.number)}
      contentContainerClassName="p-4 pb-24"
      stickySectionHeadersEnabled={false}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListHeaderComponent={
        <View className="flex-row items-center gap-3 rounded-2xl bg-navy p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="bulb" size={22} color="#fde68a" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">
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
      renderSectionHeader={({ section }) => {
        const total = section.data.length;
        const read = section.data.filter((c) => c.number <= progress.chaptersRead).length;
        const done = read === total;
        return (
          <View className="mb-3 mt-6 flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${section.color}20` }}
            >
              <Ionicons name={section.icon as keyof typeof Ionicons.glyphMap} size={20} color={section.color} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-navy">{section.title}</Text>
              <Text className="text-xs text-navy/50">{section.subtitle}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              {done && <Ionicons name="checkmark-circle" size={14} color="#2ec4b6" />}
              <Text className="text-xs font-semibold" style={{ color: done ? "#2ec4b6" : section.color }}>
                {read}/{total}
              </Text>
            </View>
          </View>
        );
      }}
      renderItem={({ item, section }) => {
        const status = statusFor(item.number, progress);
        const meta = STATUS_META[status];
        const disabled = status === "waiting" || status === "locked";

        return (
          <Pressable
            disabled={disabled}
            onPress={() =>
              router.push({
                pathname: "/perfil/pilulas-sabedoria/capitulo/[numero]",
                params: { numero: String(item.number) },
              })
            }
            className={`flex-row items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ${
              disabled ? "opacity-60" : ""
            }`}
          >
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${section.color}14` }}
            >
              <Text className="text-xs font-bold" style={{ color: section.color }}>
                {item.number}
              </Text>
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
