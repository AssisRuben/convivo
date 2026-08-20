import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { getBearTier, type PetGoalType } from "@/constants/petStages";

const BASE_SIZE = 110;

const SPARKLES: Record<"hearts" | "stars", string[]> = {
  hearts: ["💕", "💗", "💓"],
  stars: ["⭐", "✨", "⭐"],
};

/**
 * O bichinho — emoji de urso (sem risco de licença) com troféu(s),
 * medalha e coroa se acumulando conforme a fase, imitando a progressão de
 * "personagem ganhando itens" pedida pelo usuário. Tudo posicionado de
 * forma absoluta ao redor de um grupo que balança inteiro via Reanimated
 * (assim os acessórios nunca se desalinham do personagem).
 */
export function PetAnimation({
  goalType,
  milestoneValue,
}: {
  goalType: PetGoalType;
  milestoneValue: number;
}) {
  const tier = getBearTier(goalType, milestoneValue);
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [bounce]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { scale: tier.scale }],
  }));

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
              fontSize: 18,
              top: [2, 26, 50][i],
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

      <Animated.View style={[{ width: BASE_SIZE, height: BASE_SIZE }, animatedStyle]}>
        <Text style={{ fontSize: BASE_SIZE, lineHeight: BASE_SIZE }}>🐻</Text>
        {tier.crown && (
          <Text
            className="absolute w-full text-center"
            style={{ fontSize: BASE_SIZE * 0.4, top: -20 }}
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
