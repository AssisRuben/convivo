import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiFeedItem } from "@/lib/api";

const PAGE_SIZE = 10;

function FeedCard({
  item,
  onToggleLike,
}: {
  item: ApiFeedItem;
  onToggleLike: (item: ApiFeedItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} className="h-56 w-full" resizeMode="cover" />
      )}
      <View className="gap-1 p-4">
        <Text className="font-semibold text-navy">{item.title}</Text>
        <Text className="text-sm text-navy/70">{item.message}</Text>

        {item.extra && (
          <Pressable onPress={() => setExpanded((prev) => !prev)} className="mt-1 flex-row items-center gap-1">
            <Text className="text-xs font-medium text-navy/50">
              {expanded ? "Ver menos" : "Ver mais"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14}
              color="#0b1e3d80"
            />
          </Pressable>
        )}
        {expanded && (
          <Text className="mt-1 rounded-xl bg-mint/5 p-3 text-sm text-navy/70">{item.extra}</Text>
        )}

        <View className="mt-2 flex-row items-center gap-4 border-t border-navy/5 pt-3">
          <Pressable
            onPress={() => onToggleLike(item)}
            className="flex-row items-center gap-1.5"
          >
            <Ionicons
              name={item.liked ? "heart" : "heart-outline"}
              size={16}
              color={item.liked ? "#e63946" : "#0b1e3d80"}
            />
            <Text className={item.liked ? "text-sm font-medium text-coral" : "text-sm font-medium text-navy/50"}>
              {item.likeCount > 0 ? item.likeCount : "Curtir"}
            </Text>
          </Pressable>

          <Text className="text-xs text-navy/40">{item.dateLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [items, setItems] = useState<ApiFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const loadedOnce = useRef(false);

  const loadPage = useCallback(async (offset: number) => {
    const res = await apiFetch(`/api/mobile/feed?offset=${offset}&limit=${PAGE_SIZE}`);
    if (!res.ok) return { items: [] as ApiFeedItem[], hasMore: false };
    return (await res.json()) as { items: ApiFeedItem[]; hasMore: boolean };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadPage(0);
      setItems(data.items);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      loadInitial();
    }, [loadInitial])
  );

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
          i.itemKey === item.itemKey
            ? { ...i, liked: item.liked, likeCount: item.likeCount }
            : i
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
      contentContainerClassName="gap-3 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0b1e3d" />}
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
      renderItem={({ item }) => <FeedCard item={item} onToggleLike={handleToggleLike} />}
    />
  );
}
