import { useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { showAlert } from "@/lib/alert";
import { useAndroidKeyboardAvoidance } from "@/lib/useAndroidKeyboardAvoidance";

export default function CadastroScreen() {
  const { register } = useAuth();
  useAndroidKeyboardAvoidance();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, referralCode.trim());
    } catch (error) {
      showAlert("Erro ao criar conta", error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-1 text-2xl font-bold text-navy">Criar conta</Text>
      <Text className="mb-8 text-navy/60">Leva menos de um minuto</Text>

      <View className="gap-3">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome completo"
          className="rounded-xl border border-navy/10 bg-card p-3.5"
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          className="rounded-xl border border-navy/10 bg-card p-3.5"
        />
        <View className="flex-row items-center rounded-xl border border-navy/10 bg-card pr-3.5">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Senha (mín. 6 caracteres)"
            secureTextEntry={!showPassword}
            className="flex-1 p-3.5"
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
        <TextInput
          value={referralCode}
          onChangeText={setReferralCode}
          placeholder="Código de indicação (opcional)"
          autoCapitalize="characters"
          className="rounded-xl border border-navy/10 bg-card p-3.5"
        />

        <Pressable
          disabled={loading}
          onPress={handleSubmit}
          className="mt-2 items-center rounded-xl bg-navy p-3.5 disabled:opacity-50"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Criar conta</Text>
          )}
        </Pressable>
      </View>

      <Link href="/login" className="mt-6 text-center text-coral">
        Já tem conta? Entrar
      </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
