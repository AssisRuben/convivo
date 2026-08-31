import { useEffect, useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { showAlert } from "@/lib/alert";

/** Brilho pulsando devagar atrás do símbolo — dá vida ao topo sem chamar
 * atenção demais. `Animated` do core, não reanimated (ver PetAnimation.tsx
 * pro motivo: o binário nativo do Expo Go trava com react-native-worklets). */
function PulsingMark() {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        shadowColor: "#f59e0b",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      }}
      className="h-16 w-16 items-center justify-center rounded-full bg-white/10"
    >
      <Text style={{ fontSize: 30 }}>✨</Text>
    </Animated.View>
  );
}

/** Leve encolhida ao pressionar — sem isso os botões ficam estáticos e a
 * tela parece mais "formulário" do que produto de verdade. */
function PressableScale({
  children,
  style,
  ...props
}: Omit<PressableProps, "style"> & { children: React.ReactNode; style?: ViewStyle }) {
  const [scale] = useState(() => new Animated.Value(1));

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  }

  return (
    <Pressable {...props} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [cardOpacity] = useState(() => new Animated.Value(0));
  const [cardTranslateY] = useState(() => new Animated.Value(28));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        damping: 14,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  async function handleSubmit() {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      showAlert("Erro ao entrar", error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-cream"
    >
      <LinearGradient
        colors={["#0b1e3d", "#16305c", "#0b1e3d"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="items-center overflow-hidden pb-16 pt-24"
      >
        {/* Faixa de brilho diagonal — mesmo acabamento usado no cartão
         * fidelidade, reaproveitado aqui pra dar textura ao fundo escuro. */}
        <View
          style={{
            position: "absolute",
            top: -50,
            right: -40,
            width: 180,
            height: 300,
            backgroundColor: "rgba(255,255,255,0.06)",
            transform: [{ rotate: "18deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -60,
            left: -50,
            width: 160,
            height: 260,
            backgroundColor: "rgba(46,196,182,0.08)",
            transform: [{ rotate: "-12deg" }],
          }}
        />

        <PulsingMark />
        <Text className="mt-4 text-3xl font-extrabold tracking-tight text-white">Convivo</Text>
        <Text className="mt-1 text-sm text-white/60">Cuidando de você, todo dia</Text>
      </LinearGradient>

      <Animated.View
        style={{
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }],
          marginTop: -32,
        }}
        className="flex-1 px-6"
      >
        <View
          className="gap-3 rounded-3xl bg-card p-5"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <Text className="mb-1 text-lg font-bold text-navy">Entrar</Text>

          <View className="flex-row items-center gap-2.5 rounded-xl border border-navy/10 bg-cream px-3.5">
            <Ionicons name="mail-outline" size={18} color="#0b1e3d80" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#0b1e3d60"
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 py-3.5 text-navy"
            />
          </View>

          <View className="flex-row items-center gap-2.5 rounded-xl border border-navy/10 bg-cream px-3.5">
            <Ionicons name="lock-closed-outline" size={18} color="#0b1e3d80" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor="#0b1e3d60"
              secureTextEntry={!showPassword}
              className="flex-1 py-3.5 text-navy"
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              accessibilityLabel={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#0b1e3d80"
              />
            </Pressable>
          </View>

          <PressableScale disabled={loading} onPress={handleSubmit} style={{ marginTop: 6 }}>
            <LinearGradient
              colors={["#0b1e3d", "#16305c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="items-center rounded-xl py-3.5"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">Entrar</Text>
              )}
            </LinearGradient>
          </PressableScale>
        </View>

        <Link href="/cadastro" className="mt-6 text-center text-navy/60">
          Não tem conta? <Text className="font-semibold text-coral">Criar conta</Text>
        </Link>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
