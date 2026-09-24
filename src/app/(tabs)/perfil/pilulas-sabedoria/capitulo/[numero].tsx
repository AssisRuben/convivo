import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiWisdomProgress } from "@/lib/api";
import { WISDOM_CHAPTERS } from "@/constants/wisdomPills";
import { showAlert } from "@/lib/alert";

function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) {
  const paddingToBottom = 32;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
}

/** Markdown inline bem simples — **negrito**, *itálico* e ***os dois
 * juntos*** (ver constants/wisdomPills.ts). */
function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <Text className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("***") && part.endsWith("***")) {
          return (
            <Text key={i} className="font-bold italic">
              {part.slice(3, -3)}
            </Text>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} className="font-bold">
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <Text key={i} className="italic">
              {part.slice(1, -1)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export default function PilulaLeituraScreen() {
  const router = useRouter();
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const chapter = WISDOM_CHAPTERS.find((c) => c.number === Number(numero));

  const [progress, setProgress] = useState<ApiWisdomProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState<ApiWisdomProgress | null>(null);
  const triggeredRef = useRef(false);
  const scrollViewHeightRef = useRef(0);

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

  async function handleReachedEnd() {
    if (!chapter || triggeredRef.current || completing) return;
    if (!progress) return;

    const alreadyRead = chapter.number <= progress.chaptersRead;
    const isNext = chapter.number === progress.chaptersRead + 1;
    if (alreadyRead || !isNext || !progress.nextChapterAvailable) return;

    triggeredRef.current = true;
    setCompleting(true);
    try {
      const res = await apiFetch("/api/mobile/wisdom/complete", {
        method: "POST",
        body: JSON.stringify({ chapterNumber: chapter.number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
      setProgress(data);
      setResult(data);
    } catch (error) {
      triggeredRef.current = false;
      showAlert("Não foi possível salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setCompleting(false);
    }
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isCloseToBottom(e.nativeEvent)) handleReachedEnd();
  }

  function onContentSizeChange(_width: number, height: number) {
    // Capítulo curto o bastante pra não precisar rolar — conta como lido
    // na hora, sem esperar um scroll que nunca vai acontecer.
    if (scrollViewHeightRef.current > 0 && height <= scrollViewHeightRef.current) {
      handleReachedEnd();
    }
  }

  if (loading || !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-cream p-6">
        <Text className="text-center text-navy/60">Capítulo não encontrado.</Text>
        <Pressable onPress={() => router.back()} className="rounded-full bg-navy px-5 py-2.5">
          <Text className="text-sm font-semibold text-white">Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const alreadyRead = chapter.number <= progress.chaptersRead;
  const isNext = chapter.number === progress.chaptersRead + 1;
  const accessible = alreadyRead || (isNext && progress.nextChapterAvailable);

  if (!accessible) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-cream p-6">
        <Ionicons name="time-outline" size={32} color="#0b1e3d60" />
        <Text className="text-center text-navy/60">
          {isNext
            ? "Esse capítulo libera amanhã — um por dia pra dar tempo de refletir."
            : "Esse capítulo ainda não foi liberado."}
        </Text>
        <Pressable onPress={() => router.back()} className="rounded-full bg-navy px-5 py-2.5">
          <Text className="text-sm font-semibold text-white">Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 pb-16"
        onLayout={(e) => {
          scrollViewHeightRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={onContentSizeChange}
        onScroll={onScroll}
        scrollEventThrottle={100}
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-coral">
          Capítulo {chapter.number}
        </Text>
        <Text className="mt-1 text-2xl font-extrabold text-navy">{chapter.title}</Text>
        <Text className="mt-1 text-sm text-navy/60">{chapter.subtitle}</Text>

        <View className="mt-6 gap-4">
          {chapter.blocks.map((block, i) => {
            if (block.type === "heading") {
              return (
                <Text key={i} className="mt-2 text-lg font-bold text-navy">
                  {block.text}
                </Text>
              );
            }
            if (block.type === "quote") {
              return (
                <View key={i} className="rounded-2xl bg-navy/5 p-4">
                  <RichText
                    text={block.text}
                    className="text-center text-base italic leading-6 text-navy"
                  />
                </View>
              );
            }
            if (block.type === "list") {
              return (
                <View key={i} className="gap-2">
                  {block.items.map((item, j) => (
                    <View key={j} className="flex-row gap-2">
                      <Text className="text-sm text-coral">{block.ordered ? `${j + 1}.` : "•"}</Text>
                      <RichText text={item} className="flex-1 text-base leading-6 text-navy/80" />
                    </View>
                  ))}
                </View>
              );
            }
            return <RichText key={i} text={block.text} className="text-base leading-6 text-navy/80" />;
          })}
        </View>
      </ScrollView>

      <Modal visible={result !== null} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <View className="w-full max-w-sm items-center gap-3 rounded-3xl bg-card p-6">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#f59e0b]/15">
              <Ionicons name="sparkles" size={26} color="#f59e0b" />
            </View>
            <Text className="text-center text-lg font-bold text-navy">
              Sua sabedoria aumentou!
            </Text>
            {result && (
              <Text className="text-center text-sm text-navy/60">
                🔥 {result.streakDays} dia{result.streakDays > 1 ? "s seguidos" : " seguido"} de
                leitura
              </Text>
            )}
            <Pressable
              onPress={() => router.replace("/perfil/pilulas-sabedoria")}
              className="mt-2 w-full items-center rounded-full bg-coral p-3.5"
            >
              <Text className="font-bold text-white">Continuar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
