import { useEffect, useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
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
        shadowColor: "#e63946",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        alignItems: "center",
        justifyContent: "center",
      }}
      className="h-16 w-16 rounded-full bg-white/10"
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
  const { height: windowHeight } = useWindowDimensions();
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
      style={{ flex: 1 }}
    >
      {/* minHeight na dimensão real da janela em vez de só confiar em
       * flex:1 — no web, sem a cadeia html/body/#root com altura 100%
       * (fora do nosso controle direto), flex:1 não tem o que encher e o
       * conteúdo encolhe pro topo, deixando vazio embaixo (era isso que
       * causava o card grudado no topo com espaço morto atrás dele). */}
      <ScrollView
        className="bg-cream"
        contentContainerStyle={{ minHeight: windowHeight, flexGrow: 1, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
      >
      {/* No navegador desktop o app renderia na largura cheia da janela
       * (pensado só pra tela de celular) — sobrava um vazio enorme do
       * lado, não embaixo como parecia num recorte estreito de print.
       * maxWidth trava numa coluna de "tamanho de celular" centralizada;
       * no celular de verdade (sempre mais estreito que 480) isso não
       * muda nada, só evita o esparramado no desktop. */}
      <View style={{ width: "100%", maxWidth: 480, flex: 1 }}>
        <LinearGradient
          colors={["#0b1e3d", "#16305c", "#0b1e3d"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ alignItems: "center", overflow: "hidden", paddingTop: 96, paddingBottom: 64 }}
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
              backgroundColor: "rgba(230,57,70,0.08)",
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
            flex: 1,
            justifyContent: "center",
          }}
          className="px-6"
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

            <PressableScale
              disabled={loading}
              onPress={handleSubmit}
              style={{
                marginTop: 10,
                marginHorizontal: -4,
                borderRadius: 999,
                shadowColor: "#e63946",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <LinearGradient
                colors={["#e63946", "#c1121f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  paddingVertical: 17,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center text-base font-bold tracking-wide text-white">
                    Entrar
                  </Text>
                )}
              </LinearGradient>
            </PressableScale>
          </View>

          <Link href="/cadastro" className="mt-6 text-center text-navy/60">
            Não tem conta? <Text className="font-semibold text-coral">Criar conta</Text>
          </Link>
        </Animated.View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
