import { useRef, useState } from "react";
import { Image, Linking, Platform, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import type { ApiFeedItem } from "@/lib/api";
import { LADDER_LENGTHS, getBearTier, getPetPhoto, petProgressLabelFor } from "@/constants/petStages";
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
  const cardRef = useRef<View>(null);
  const hasPet = item.goalType != null && item.stage != null && item.milestoneValue != null;
  const bearTier = hasPet ? getBearTier(item.goalType!, item.milestoneValue!) : null;
  const petPhoto = hasPet ? getPetPhoto(item.goalType!, item.milestoneValue!) : undefined;
  const progressPercent = hasPet
    ? Math.round(((item.stage! + 1) / LADDER_LENGTHS[item.goalType!]) * 100)
    : 0;

  /**
   * Tira um "print" do card da conquista (bichinho + troféus + título) e
   * abre o menu nativo de compartilhamento com essa imagem — não funciona
   * no preview web (view-shot e o Web Share API de arquivo local não dão
   * suporte a isso), então falha em silêncio lá: o toggle de publicar no
   * feed do app (onToggleShare, chamado independente disso) continua
   * funcionando normalmente.
   */
  async function handleShareImage() {
    if (Platform.OS === "web" || !cardRef.current) return;
    try {
      const uri = await captureRef(cardRef, { format: "jpg", quality: 0.9 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: "Compartilhar conquista" });
      }
    } catch {
      // Best-effort — publicar no feed já aconteceu de qualquer forma.
    }
  }

  return (
    <View
      className={
        hasPet
          ? "overflow-hidden rounded-3xl border-4 border-black bg-card shadow-sm"
          : "overflow-hidden rounded-2xl bg-card shadow-sm"
      }
    >
      {hasPet && petPhoto ? (
        // Degrau com foto real (ver getPetPhoto) — a foto vira o card
        // inteiro, com título/progresso sobrepostos por cima de um
        // degradê escuro. Altura fixa (não aspectRatio calculado) +
        // resizeMode="contain": jeito mais simples possível de garantir
        // que a foto inteira sempre aparece, sem cortar nada.
        <View ref={cardRef} collapsable={false} style={{ position: "relative" }}>
          <Image
            source={petPhoto}
            style={{ width: "100%", height: 220, backgroundColor: "#0b1e3d" }}
            resizeMode="contain"
          />
          <LinearGradient
            colors={["transparent", "rgba(2,6,23,0.15)", "rgba(2,6,23,0.9)"]}
            locations={[0, 0.45, 1]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Text className="text-base">{bearTier!.badge}</Text>
          </View>
          <View className="absolute inset-x-4 bottom-3 gap-1">
            <Text
              className="text-2xl font-extrabold text-white"
              style={{
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              {item.title}
            </Text>
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-[#e2e8f0]">
              {petProgressLabelFor(item.goalType!)}
            </Text>
            <View className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <View
                className="h-full rounded-full bg-[#f59e0b]"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="self-end text-[9px] font-medium text-[#cbd5e1]">
              Fase {bearTier!.label} · {progressPercent}% do objetivo
            </Text>
          </View>
        </View>
      ) : hasPet ? (
        <View ref={cardRef} collapsable={false}>
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
        </View>
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
              onPress={() => {
                onToggleShare(item);
                if (hasPet) handleShareImage();
              }}
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
