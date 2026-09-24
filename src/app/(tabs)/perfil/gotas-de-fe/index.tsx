import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiFaithBookSummary } from "@/lib/api";

export default function GotasDeFeHubScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<ApiFaithBookSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/faith");
      if (res.ok) setBooks((await res.json()).books ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !books) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  // Resumo somado dos livros — mesmo banner de Pílulas de sabedoria, só
  // que aqui soma capítulos de todos os livros e mostra a maior sequência
  // entre eles (streak é por livro, não faz sentido somar dias de leituras
  // de livros diferentes, só destacar a melhor).
  const totalRead = books.reduce((sum, b) => sum + b.chaptersRead, 0);
  const totalChapters = books.reduce((sum, b) => sum + b.totalChapters, 0);
  const bestStreak = Math.max(0, ...books.map((b) => b.streakDays));

  return (
    <FlatList
      className="flex-1 bg-cream"
      data={books}
      keyExtractor={(item) => item.slug}
      contentContainerClassName="gap-3 p-4 pb-24"
      ListHeaderComponent={
        <View className="mb-1 flex-row items-center gap-3 rounded-2xl bg-navy p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="water" size={22} color="#7dd3fc" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">
              {totalRead} de {totalChapters} capítulos lidos
            </Text>
            <Text className="mt-0.5 text-xs text-white/60">
              {bestStreak > 0
                ? `🙏 ${bestStreak} dia${bestStreak > 1 ? "s seguidos" : " seguido"}`
                : "Leia um capítulo por dia pra começar sua sequência"}
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const emptyBook = item.totalChapters === 0;
        const done = !emptyBook && item.chaptersRead >= item.totalChapters;

        return (
          <Pressable
            disabled={emptyBook}
            onPress={() =>
              router.push({ pathname: "/perfil/gotas-de-fe/[livro]", params: { livro: item.slug } })
            }
            className={`flex-row items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ${
              emptyBook ? "opacity-60" : ""
            }`}
          >
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-navy">{item.title}</Text>
              <Text className="mt-0.5 text-xs text-navy/50">{item.subtitle}</Text>
              {emptyBook ? (
                <Text className="mt-1 text-xs font-medium text-navy/40">Em breve</Text>
              ) : (
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  {done ? (
                    <Ionicons name="checkmark-circle" size={13} color="#2ec4b6" />
                  ) : (
                    <Ionicons name="book-outline" size={13} color={item.color} />
                  )}
                  <Text className="text-xs" style={{ color: done ? "#2ec4b6" : item.color }}>
                    {item.chaptersRead} de {item.totalChapters} capítulos
                    {item.streakDays > 0 ? ` · 🙏 ${item.streakDays}` : ""}
                  </Text>
                </View>
              )}
            </View>
            {!emptyBook && <Ionicons name="chevron-forward" size={16} color="#0b1e3d60" />}
          </Pressable>
        );
      }}
    />
  );
}
