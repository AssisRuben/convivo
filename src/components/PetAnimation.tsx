import { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { getBearTier, type BearTier, type PetGoalType } from "@/constants/petStages";

const DEFAULT_SIZE = 110;

const SPARKLES: Record<"hearts" | "stars", string[]> = {
  hearts: ["💕", "💗", "💓"],
  stars: ["⭐", "✨", "⭐"],
};

/**
 * O bichinho — emoji de urso (sem risco de licença) com troféu(s),
 * medalha e coroa se acumulando conforme a fase, imitando a progressão de
 * "personagem ganhando itens" pedida pelo usuário. Tudo posicionado de
 * forma absoluta ao redor de um grupo que balança inteiro. Usa o
 * `Animated` nativo do react-native, não react-native-reanimated — esse
 * exigia react-native-worklets, cujo binário nativo pré-compilado no
 * Expo Go trava o app (crash confirmado batendo no dispositivo real,
 * `libworklets.so` na pilha); `Animated` do core nunca teve esse problema.
 *
 * Só renderiza esse bichinho pra degraus sem foto real (ver
 * getPetPhoto em constants/petStages.ts) — quando existe foto, quem
 * decide isso é o FeedCard, que assume o card inteiro nesse caso.
 */
export function PetAnimation({
  goalType,
  milestoneValue,
  tier: tierProp,
  size = DEFAULT_SIZE,
}: {
  goalType?: PetGoalType;
  milestoneValue?: number;
  /** Fase já resolvida (bichinho do Home, que cresce com a sequência de
   * dias) — no feed vem goalType + milestoneValue. */
  tier?: BearTier;
  size?: number;
}) {
  const BASE_SIZE = size;
  const [bounce] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -6,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  const tier = tierProp ?? getBearTier(goalType ?? "ROTINA", milestoneValue ?? 30);
  const animatedStyle = {
    transform: [{ translateY: bounce }, { scale: tier.scale }],
  };

  const medalEmoji = tier.medal === "gold" ? "🥇" : tier.medal === "bronze" ? "🥉" : null;

  return (
    <View
      style={{
        width: BASE_SIZE * 1.9,
        height: BASE_SIZE * 1.4,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: BASE_SIZE * 1.7,
          height: BASE_SIZE * 1.7,
          borderRadius: BASE_SIZE,
          backgroundColor: "rgba(245, 158, 11, 0.22)",
        }}
      />

      {tier.sparkle &&
        SPARKLES[tier.sparkle].map((s, i) => (
          <Text
            key={i}
            style={{
              position: "absolute",
              fontSize: BASE_SIZE * 0.16,
              top: [0.02, 0.24, 0.45].map((f) => f * BASE_SIZE)[i],
              left: i % 2 === 0 ? 4 : undefined,
              right: i % 2 === 1 ? 4 : undefined,
            }}
          >
            {s}
          </Text>
        ))}

      {tier.trophyCount > 0 && (
        <Text style={{ position: "absolute", left: 2, bottom: 10, fontSize: BASE_SIZE * 0.38 }}>
          🏆
        </Text>
      )}
      {tier.trophyCount > 1 && (
        <Text style={{ position: "absolute", right: 2, bottom: 10, fontSize: BASE_SIZE * 0.38 }}>
          🏆
        </Text>
      )}

      {/* Caixa mais larga que a fonte: no Android o emoji desenha além do
          fontSize e uma caixa do tamanho exato cortava o lado direito. */}
      <Animated.View
        style={[{ width: BASE_SIZE * 1.4, height: BASE_SIZE, alignItems: "center" }, animatedStyle]}
      >
        <Text
          style={{
            fontSize: BASE_SIZE * 0.9,
            lineHeight: BASE_SIZE,
            textAlign: "center",
            includeFontPadding: false,
          }}
        >
          🐻
        </Text>
        {tier.crown && (
          <Text
            className="absolute w-full text-center"
            style={{ fontSize: BASE_SIZE * 0.4, top: -BASE_SIZE * 0.18 }}
          >
            👑
          </Text>
        )}
        {medalEmoji && (
          <Text
            className="absolute w-full text-center"
            style={{ fontSize: BASE_SIZE * 0.3, top: BASE_SIZE * 0.58 }}
          >
            {medalEmoji}
          </Text>
        )}
      </Animated.View>

      {tier.ribbon && (
        <View
          style={{
            position: "absolute",
            bottom: -4,
            backgroundColor: "#f59e0b",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: "#1e1608", letterSpacing: 0.5 }}>
            {tier.ribbon}
          </Text>
        </View>
      )}
    </View>
  );
}
