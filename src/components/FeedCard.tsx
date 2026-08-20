import { useState } from "react";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { ApiFeedItem } from "@/lib/api";
import { LADDER_LENGTHS, getBearTier, petProgressLabelFor } from "@/constants/petStages";
import { PetAnimation } from "@/components/PetAnimation";

// Offsets sempre positivos, dentro da área visível do banner — o card
// tem overflow-hidden (pras pontas arredondadas), então qualquer coisa
// posicionada com offset negativo perto da borda fica cortada.
const CONFETTI = [
  { emoji: "🎉", top: 4, left: 10, rotate: "-15deg" },
  { emoji: "✨", top: 8, right: 14, rotate: "10deg" },
  { emoji: "🎊", bottom: 16, left: 18, rotate: "8deg" },
];

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
  const hasPet = item.goalType != null && item.stage != null && item.milestoneValue != null;
  const bearTier = hasPet ? getBearTier(item.goalType!, item.milestoneValue!) : null;
  const progressPercent = hasPet
    ? Math.round(((item.stage! + 1) / LADDER_LENGTHS[item.goalType!]) * 100)
    : 0;

  return (
    <View
      className={
        hasPet
          ? "overflow-hidden rounded-3xl border-4 border-black bg-card shadow-sm"
          : "overflow-hidden rounded-2xl bg-card shadow-sm"
      }
    >
      {hasPet ? (
        <LinearGradient
          colors={["#134e4a", "#042f2e", "#020617"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="items-center gap-2 px-4 py-8"
        >
          <View className="w-full flex-row justify-end">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <Text className="text-base">{bearTier!.badge}</Text>
            </View>
          </View>

          <View className="w-full items-center justify-center" style={{ height: 200 }}>
            {CONFETTI.map((c, i) => (
              <Text
                key={i}
                className="absolute text-lg"
                style={{
                  top: c.top,
                  left: c.left,
                  right: c.right,
                  bottom: c.bottom,
                  transform: [{ rotate: c.rotate }],
                }}
              >
                {c.emoji}
              </Text>
            ))}
            <PetAnimation goalType={item.goalType!} milestoneValue={item.milestoneValue!} />
          </View>

          <Text
            className="mt-2 text-4xl font-extrabold text-white"
            style={{
              textShadowColor: "rgba(0,0,0,0.35)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {item.title}
          </Text>
          <Text className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
            {petProgressLabelFor(item.goalType!)}
          </Text>

          <View className="mt-3 w-full gap-1">
            <View className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <View
                className="h-full rounded-full bg-[#f59e0b]"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="self-end text-[10px] font-medium text-[#cbd5e1]">
              Fase {bearTier!.label} · {progressPercent}% do objetivo
            </Text>
          </View>
        </LinearGradient>
      ) : (
        Boolean(item.imageUrl) && (
          <Image source={{ uri: item.imageUrl! }} className="h-56 w-full" resizeMode="cover" />
        )
      )}
      <View className="gap-1 p-4">
        {!hasPet && Boolean(item.authorName) && (
          <Text className="mb-0.5 text-xs font-medium text-mint">
            🎉 {item.authorName} conquistou algo!
          </Text>
        )}
        {!hasPet && !item.authorName && item.kind === "achievement" && (
          <Text className="mb-0.5 text-xs font-medium text-mint">Sua conquista</Text>
        )}

        {!hasPet && <Text className="font-semibold text-navy">{item.title}</Text>}
        <Text className="text-sm text-navy/70">{item.message}</Text>

        {Boolean(item.sourceUrl) && (
          <Pressable onPress={() => Linking.openURL(item.sourceUrl!)} className="mt-1">
            <Text className="text-xs font-medium text-mint">Ler notícia completa →</Text>
          </Pressable>
        )}

        {Boolean(item.extra) && (
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

          {Boolean(item.shareState) && onToggleShare && (
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
