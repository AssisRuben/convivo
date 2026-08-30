import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { apiFetch, type ApiFeedItem } from "@/lib/api";
import { FeedCard } from "@/components/FeedCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { FEED_INITIAL_CACHE_KEY, fetchFeedInitial } from "@/lib/tabPrefetch";
import { getCached, loadCached, setCached } from "@/lib/tabDataCache";

const PAGE_SIZE = 10;

const cachedInitial = getCached<{ items: ApiFeedItem[]; hasMore: boolean }>(FEED_INITIAL_CACHE_KEY);

export default function FeedScreen() {
  const [items, setItems] = useState<ApiFeedItem[]>(cachedInitial?.items ?? []);
  const [loading, setLoading] = useState(cachedInitial === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(cachedInitial?.hasMore ?? false);
  const loadedOnce = useRef(false);

  const loadPage = useCallback(async (offset: number) => {
    const res = await apiFetch(`/api/mobile/feed?offset=${offset}&limit=${PAGE_SIZE}`);
    if (!res.ok) return { items: [] as ApiFeedItem[], hasMore: false };
    return (await res.json()) as { items: ApiFeedItem[]; hasMore: boolean };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCached(FEED_INITIAL_CACHE_KEY, fetchFeedInitial);
      setItems(data.items);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      if (cachedInitial !== undefined) return; // já veio do cache/prefetch
      loadInitial();
    }, [loadInitial])
  );

  // Espelha a página inicial no cache (não a paginação seguinte — só o
  // que o prefetch/primeira carga populam faz sentido reaproveitar).
  useEffect(() => {
    if (!loading) setCached(FEED_INITIAL_CACHE_KEY, { items, hasMore });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hasMore]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      const data = await loadPage(0);
      setItems(data.items);
      setHasMore(data.hasMore);
    } finally {
      setRefreshing(false);
    }
  }

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

  async function handleToggleShare(item: ApiFeedItem) {
    const nextShared = item.shareState === "shared" ? "shareable" : "shared";
    setItems((prev) =>
      prev.map((i) => (i.itemKey === item.itemKey ? { ...i, shareState: nextShared } : i))
    );
    try {
      await apiFetch("/api/mobile/feed/share", {
        method: nextShared === "shared" ? "POST" : "DELETE",
        body: JSON.stringify({ eventId: item.itemKey }),
      });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.itemKey === item.itemKey ? { ...i, shareState: item.shareState } : i))
      );
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <FlatList
      className="flex-1 bg-cream"
      data={items}
      keyExtractor={(item) => item.itemKey}
      contentContainerClassName="gap-3 p-4 pb-24"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0b1e3d" />
      }
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      ListEmptyComponent={
        <Text className="mt-8 text-center text-navy/60">Nada por aqui ainda.</Text>
      }
      ListFooterComponent={
        loadingMore ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#0b1e3d" />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <FeedCard item={item} onToggleLike={handleToggleLike} onToggleShare={handleToggleShare} />
      )}
    />
  );
}
