import { useEffect, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const useNativeDriver = Platform.OS !== "web";
const AUTO_DISMISS_MS = 1600;

/**
 * Comemoração leve pra cada atividade marcada — diferente do
 * CelebrationModal (confete, tela cheia) usado em Pílulas/Gotas e no
 * streak do primeiro cuidado do dia: aqui é um cartão pequeno, sem
 * confete, que aparece e some sozinho, pra não cansar quem marca várias
 * atividades seguidas.
 */
export function RotinaCompleteToast({
  visible,
  title,
  onDone,
}: {
  visible: boolean;
  title: string;
  onDone: () => void;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, friction: 6, tension: 90, useNativeDriver }).start();
    const timer = setTimeout(onDone, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 top-14 items-center px-6">
      <Pressable onPress={onDone}>
        <Animated.View
          style={{ opacity: progress, transform: [{ scale }, { translateY }] }}
          className="w-full max-w-sm flex-row items-center gap-3 rounded-2xl bg-mint px-4 py-3.5 shadow-lg"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-extrabold text-white">Aí tu deu aula! 🎉</Text>
            <Text className="text-xs text-white/90" numberOfLines={1}>
              {title}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}
