import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";

const DOT_COLORS = ["#e63946", "#2ec4b6", "#0b1e3d"];

function BouncingDot({ delay, color }: { delay: number; color: string }) {
  const [translateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(560 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [translateY, delay]);

  return (
    <Animated.View
      style={{ transform: [{ translateY }], backgroundColor: color }}
      className="h-3 w-3 rounded-full"
    />
  );
}

/** Substitui o `<ActivityIndicator>` cru usado nas telas das abas —
 * mesma função (indicar carregamento), mais alinhado com a marca. Usa
 * `Animated` do core, não reanimated (ver PetAnimation.tsx pro motivo:
 * o binário nativo do Expo Go trava com react-native-worklets). */
export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <View className="flex-row gap-2.5">
        {DOT_COLORS.map((color, i) => (
          <BouncingDot key={color} delay={i * 160} color={color} />
        ))}
      </View>
    </View>
  );
}
