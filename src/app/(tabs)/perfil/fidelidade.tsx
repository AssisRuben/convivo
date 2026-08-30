import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Animated, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiLoyaltyProgress } from "@/lib/api";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Um medalhão do cartão — os conquistados "giram e estouram" pra dentro em
 * cascata (delay por índice) toda vez que a tela ganha foco, imitando uma
 * moeda caindo no lugar. Os vazios ficam estáticos (nada a revelar). Usa
 * `Animated` nativo do react-native, não react-native-reanimated — esse
 * exigia react-native-worklets, cujo binário nativo pré-compilado no
 * Expo Go trava o app (crash confirmado batendo no dispositivo real,
 * `libworklets.so` na pilha); `Animated` do core nunca teve esse problema.
 */
function StampSlot({ index, filled }: { index: number; filled: boolean }) {
  const [scale] = useState(() => new Animated.Value(filled ? 0 : 1));
  const [opacity] = useState(() => new Animated.Value(filled ? 0 : 1));
  const [rotate] = useState(() => new Animated.Value(filled ? -12 : 0));

  useEffect(() => {
    if (!filled) return;
    const delay = index * 90;
    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.18, damping: 6, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, damping: 9, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(rotate, { toValue: 0, damping: 8, useNativeDriver: true }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled, index]);

  const animatedStyle = {
    transform: [
      { scale },
      { rotate: rotate.interpolate({ inputRange: [-12, 0], outputRange: ["-12deg", "0deg"] }) },
    ],
    opacity,
  };

  if (!filled) {
    return (
      <View className="items-center gap-1">
        <View className="h-14 w-14 items-center justify-center rounded-full border border-navy/10 bg-navy/[0.04]">
          <Text className="text-sm font-semibold text-navy/25">{index + 1}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="items-center gap-1">
      <Animated.View
        style={[
          animatedStyle,
          {
            shadowColor: "#b45309",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 5,
            elevation: 4,
          },
        ]}
        className="h-14 w-14 overflow-hidden rounded-full"
      >
        <LinearGradient
          colors={["#fde68a", "#f59e0b", "#b45309"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          className="h-full w-full items-center justify-center border border-[#fde68a]/60"
        >
          <Ionicons name="checkmark" size={22} color="#3a2408" />
        </LinearGradient>
      </Animated.View>
    </View>
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
      <View
        style={{
          shadowColor: "#c1121f",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.28,
          shadowRadius: 22,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={["#c1121f", "#e63946", "#ff8f3f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="overflow-hidden rounded-3xl border border-white/15 px-6 py-7"
        >
          {/* Faixa de brilho diagonal — dá o acabamento "cartão premium" */}
          <View
            style={{
              position: "absolute",
              top: -40,
              left: -30,
              width: 140,
              height: 260,
              backgroundColor: "rgba(255,255,255,0.10)",
              transform: [{ rotate: "22deg" }],
            }}
          />

          <View className="items-center gap-2">
            <View
              className="h-12 w-12 items-center justify-center rounded-full border border-[#fde68a]/50"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <LinearGradient
                colors={["#fde68a", "#f59e0b"]}
                className="h-full w-full items-center justify-center rounded-full"
              >
                <Ionicons name="medal" size={22} color="#3a2408" />
              </LinearGradient>
            </View>

            <Text
              className="mt-1 text-xl font-extrabold tracking-tight text-white"
              style={{
                textShadowColor: "rgba(0,0,0,0.25)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              Cartão Fidelidade
            </Text>
            <Text className="text-center text-[13px] leading-5 text-white/90">
              A cada 10 compras de {formatPrice(progress.minOrderCents)} ou mais, você ganha{" "}
              <Text className="font-bold text-white">
                {formatPrice(progress.rewardPerCycleCents)}
              </Text>{" "}
              de crédito.
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View className="mt-6 flex-row flex-wrap justify-center gap-3 rounded-2xl bg-card p-5 shadow-sm">
        {slots.map((filled, i) => (
          <StampSlot key={i} index={i} filled={filled} />
        ))}
      </View>

      <Text className="mt-5 text-center text-lg font-bold text-navy">
        {progress.stampsFilled} de {progress.stampsTotal} selos
      </Text>
      <Text className="mt-1 text-center text-sm text-navy/60">
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

      <View className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
        <Text className="text-center text-xs leading-5 text-navy/55">
          Cada pedido aprovado de {formatPrice(progress.minOrderCents)} ou mais conta como 1 selo.
          O crédito ganho cai no seu saldo — o mesmo usado nas indicações — pra usar nas próximas
          compras.
        </Text>
      </View>
    </ScrollView>
  );
}
