import { useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert("Erro ao entrar", error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-center bg-cream px-6"
    >
      <Text className="mb-1 text-2xl font-bold text-navy">Convivo</Text>
      <Text className="mb-8 text-navy/60">Entre na sua conta</Text>

      <View className="gap-3">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          className="rounded-xl border border-navy/10 bg-card p-3.5"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry
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
            <Text className="font-semibold text-white">Entrar</Text>
          )}
        </Pressable>
      </View>

      <Link href="/cadastro" className="mt-6 text-center text-mint">
        Não tem conta? Criar conta
      </Link>
    </KeyboardAvoidingView>
  );
}
