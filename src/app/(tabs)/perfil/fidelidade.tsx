import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { apiFetch, type ApiLoyaltyProgress } from "@/lib/api";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Um selo do cartão — os preenchidos "estouram" pra dentro em cascata (delay
 * por índice) toda vez que a tela ganha foco, pra dar a sensação de cartão
 * enchendo. Os vazios ficam estáticos (nada a revelar).
 */
function StampSlot({ index, filled }: { index: number; filled: boolean }) {
  const scale = useSharedValue(filled ? 0 : 1);
  const opacity = useSharedValue(filled ? 0 : 1);

  useEffect(() => {
    if (!filled) return;
    scale.value = withDelay(
      index * 90,
      withSequence(withSpring(1.18, { damping: 6 }), withSpring(1, { damping: 9 }))
    );
    opacity.value = withDelay(index * 90, withTiming(1, { duration: 180 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={
        filled
          ? "h-14 w-14 items-center justify-center rounded-full bg-mint shadow-sm"
          : "h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-navy/20"
      }
    >
      {filled ? (
        <Ionicons name="paw" size={22} color="#ffffff" />
      ) : (
        <Text className="text-sm font-semibold text-navy/30">{index + 1}</Text>
      )}
    </Animated.View>
  );
}

export default function FidelidadeScreen() {
  const [progress, setProgress] = useState<ApiLoyaltyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/fidelidade");
      if (res.ok) {
        setProgress(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      load();
    }, [load])
  );

  if (loading || !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const remaining = progress.stampsTotal - progress.stampsFilled;
  const justCompleted = progress.stampsFilled === 0 && progress.completedCycles > 0;
  const slots = Array.from({ length: progress.stampsTotal }, (_, i) => i < progress.stampsFilled);

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-24">
      <LinearGradient
        colors={["#e63946", "#ff5a67", "#f59e0b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="items-center gap-1.5 rounded-3xl px-6 py-7"
      >
        <Ionicons name="ribbon-outline" size={28} color="#ffffff" />
        <Text className="mt-1 text-lg font-bold text-white">Cartão Fidelidade</Text>
        <Text className="text-center text-xs text-white/85">
          A cada 10 compras de {formatPrice(progress.minOrderCents)} ou mais, você ganha{" "}
          {formatPrice(progress.rewardPerCycleCents)} de crédito.
        </Text>
      </LinearGradient>

      <View className="mt-6 flex-row flex-wrap justify-center gap-3 rounded-2xl bg-card p-5 shadow-sm">
        {slots.map((filled, i) => (
          <StampSlot key={i} index={i} filled={filled} />
        ))}
      </View>

      <Text className="mt-4 text-center text-sm font-medium text-navy">
        {progress.stampsFilled} de {progress.stampsTotal} selos
      </Text>
      <Text className="mt-1 text-center text-xs text-navy/60">
        {justCompleted
          ? "Prêmio creditado! Um novo cartão já começou."
          : `Faltam ${remaining} compra${remaining > 1 ? "s" : ""} pro próximo prêmio.`}
      </Text>

      {progress.completedCycles > 0 && (
        <View className="mt-6 flex-row items-center gap-3 rounded-2xl bg-card p-5 shadow-sm">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-[#f59e0b]/15">
            <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-navy">
              {progress.completedCycles} cartão{progress.completedCycles > 1 ? "ões" : ""} completo
              {progress.completedCycles > 1 ? "s" : ""}
            </Text>
            <Text className="text-xs text-navy/60">
              {formatPrice(progress.totalRewardCents)} em créditos ganhos até agora
            </Text>
          </View>
        </View>
      )}

      <Text className="mt-6 text-center text-xs text-navy/50">
        Cada pedido aprovado de {formatPrice(progress.minOrderCents)} ou mais conta como 1 selo. O
        crédito ganho cai no seu saldo — o mesmo usado nas indicações — pra usar nas próximas
        compras.
      </Text>
    </ScrollView>
  );
}
