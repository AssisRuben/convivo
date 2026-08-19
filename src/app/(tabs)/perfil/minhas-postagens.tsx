import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { apiFetch, type ApiFeedItem } from "@/lib/api";
import { FeedCard } from "@/components/FeedCard";

const PAGE_SIZE = 10;

export default function MinhasPostagensScreen() {
  const [items, setItems] = useState<ApiFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const loadedOnce = useRef(false);

  const loadPage = useCallback(async (offset: number) => {
    const res = await apiFetch(`/api/mobile/minhas-postagens?offset=${offset}&limit=${PAGE_SIZE}`);
    if (!res.ok) return { items: [] as ApiFeedItem[], hasMore: false };
    return (await res.json()) as { items: ApiFeedItem[]; hasMore: boolean };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      (async () => {
        setLoading(true);
        try {
          const data = await loadPage(0);
          setItems(data.items);
          setHasMore(data.hasMore);
        } finally {
          setLoading(false);
        }
      })();
    }, [loadPage])
  );

  async function onEndReached() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await loadPage(items.length);
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleToggleLike(item: ApiFeedItem) {
    setItems((prev) =>
      prev.map((i) =>
        i.itemKey === item.itemKey
          ? { ...i, liked: !i.liked, likeCount: i.liked ? i.likeCount - 1 : i.likeCount + 1 }
          : i
      )
    );
    try {
      await apiFetch("/api/mobile/feed/like", {
        method: "POST",
        body: JSON.stringify({ itemKey: item.itemKey }),
      });
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.itemKey === item.itemKey ? { ...i, liked: item.liked, likeCount: item.likeCount } : i
        )
      );
    }
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
      keyExtractor={(item) => item.itemKey}
      contentContainerClassName="gap-3 p-4 pb-24"
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      ListEmptyComponent={
        <Text className="mt-8 text-center text-navy/60">
          Nenhuma conquista ainda — continue registrando peso e rotina que as postagens aparecem
          aqui.
        </Text>
      }
      ListFooterComponent={
        loadingMore ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#0b1e3d" />
          </View>
        ) : null
      }
      renderItem={({ item }) => <FeedCard item={item} onToggleLike={handleToggleLike} />}
    />
  );
}
