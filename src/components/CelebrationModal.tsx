import { useEffect, useState } from "react";
import { Animated, Easing, Modal, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CONFETTI_COLORS = ["#e63946", "#f59e0b", "#2ec4b6", "#3b82f6", "#8b5cf6", "#fde68a"];
const CONFETTI_COUNT = 36;
const useNativeDriver = Platform.OS !== "web";

type Piece = { x: number; delay: number; duration: number; size: number; color: string; spin: number; round: boolean };

function makePieces(width: number): Piece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    x: Math.random() * width,
    delay: Math.random() * 600,
    duration: 1800 + Math.random() * 1400,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    spin: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3),
    round: Math.random() > 0.6,
  }));
}

function ConfettiPiece({ piece, height, progress }: { piece: Piece; height: number; progress: Animated.Value }) {
  const [fall] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fall, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver,
    }).start();
  }, [fall, piece]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, height + 40] });
  const translateX = fall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, piece.spin * 8, 0] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${piece.spin * 360}deg`] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: piece.x,
        top: 0,
        width: piece.size,
        height: piece.round ? piece.size : piece.size * 1.6,
        borderRadius: piece.round ? piece.size / 2 : 2,
        backgroundColor: piece.color,
        opacity: progress,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

export function CelebrationModal({
  visible,
  icon,
  color,
  title,
  message,
  streakDays,
  streakEmoji,
  onContinue,
}: {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  message?: string;
  streakDays?: number;
  streakEmoji: string;
  onContinue: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() => makePieces(width));
  const [pop] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const [confettiOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    glow.setValue(0);
    confettiOpacity.setValue(1);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 80, useNativeDriver }).start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver }),
      ])
    );
    pulse.start();
    Animated.timing(confettiOpacity, { toValue: 0, delay: 3200, duration: 600, useNativeDriver }).start();
    return () => pulse.stop();
  }, [visible, pop, glow, confettiOpacity]);

  const iconScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const ringScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        {pieces.map((piece, i) => (
          <ConfettiPiece key={i} piece={piece} height={height} progress={confettiOpacity} />
        ))}

        <Animated.View
          style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], opacity: pop }}
          className="w-full max-w-sm items-center gap-3 rounded-3xl bg-card p-6"
        >
          <View className="h-20 w-20 items-center justify-center">
            <Animated.View
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: color,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              }}
            />
            <Animated.View
              style={{ backgroundColor: `${color}26`, transform: [{ scale: iconScale }] }}
              className="h-20 w-20 items-center justify-center rounded-full"
            >
              <Ionicons name={icon} size={36} color={color} />
            </Animated.View>
          </View>

          <Text className="text-center text-xl font-extrabold text-navy">{title}</Text>
          {message ? <Text className="text-center text-sm text-navy/60">{message}</Text> : null}

          {streakDays !== undefined && streakDays > 0 && (
            <View className="mt-1 flex-row items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: `${color}1a` }}>
              <Text className="text-lg">{streakEmoji}</Text>
              <Text className="text-sm font-bold" style={{ color }}>
                {streakDays} dia{streakDays > 1 ? "s seguidos" : " seguido"} de leitura
              </Text>
            </View>
          )}

          <Pressable onPress={onContinue} className="mt-2 w-full items-center rounded-full bg-coral p-3.5">
            <Text className="font-bold text-white">Continuar</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
