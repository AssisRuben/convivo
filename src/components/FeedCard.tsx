import { useState } from "react";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ApiFeedItem } from "@/lib/api";

export function FeedCard({
  item,
  onToggleLike,
  onToggleShare,
}: {
  item: ApiFeedItem;
  onToggleLike: (item: ApiFeedItem) => void;
  onToggleShare?: (item: ApiFeedItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} className="h-56 w-full" resizeMode="cover" />
      )}
      <View className="gap-1 p-4">
        {item.authorName && (
          <Text className="mb-0.5 text-xs font-medium text-mint">
            🎉 {item.authorName} conquistou algo!
          </Text>
        )}
        {!item.authorName && item.kind === "achievement" && (
          <Text className="mb-0.5 text-xs font-medium text-mint">Sua conquista</Text>
        )}

        <Text className="font-semibold text-navy">{item.title}</Text>
        <Text className="text-sm text-navy/70">{item.message}</Text>

        {item.sourceUrl && (
          <Pressable onPress={() => Linking.openURL(item.sourceUrl!)} className="mt-1">
            <Text className="text-xs font-medium text-mint">Ler notícia completa →</Text>
          </Pressable>
        )}

        {item.extra && (
          <Pressable
            onPress={() => setExpanded((prev) => !prev)}
            className="mt-1 flex-row items-center gap-1"
          >
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
          <Pressable onPress={() => onToggleLike(item)} className="flex-row items-center gap-1.5">
            <Ionicons
              name={item.liked ? "heart" : "heart-outline"}
              size={16}
              color={item.liked ? "#e63946" : "#0b1e3d80"}
            />
            <Text
              className={
                item.liked ? "text-sm font-medium text-coral" : "text-sm font-medium text-navy/50"
              }
            >
              {item.likeCount > 0 ? item.likeCount : "Curtir"}
            </Text>
          </Pressable>

          {item.shareState && onToggleShare && (
            <Pressable
              onPress={() => onToggleShare(item)}
              className="ml-auto flex-row items-center gap-1.5"
            >
              <Ionicons
                name={item.shareState === "shared" ? "share-social" : "lock-closed-outline"}
                size={14}
                color={item.shareState === "shared" ? "#2ec4b6" : "#0b1e3d80"}
              />
              <Text
                className={`text-xs font-medium ${
                  item.shareState === "shared" ? "text-mint" : "text-navy/50"
                }`}
              >
                {item.shareState === "shared" ? "Compartilhado" : "Compartilhar"}
              </Text>
            </Pressable>
          )}

          {!(item.shareState && onToggleShare) && (
            <Text className="ml-auto text-xs text-navy/40">{item.dateLabel}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
