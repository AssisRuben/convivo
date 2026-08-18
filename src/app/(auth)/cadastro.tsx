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

export default function CadastroScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, referralCode.trim());
    } catch (error) {
      Alert.alert("Erro ao criar conta", error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-center bg-cream px-6"
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
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha (mín. 6 caracteres)"
          secureTextEntry
          className="rounded-xl border border-navy/10 bg-card p-3.5"
        />
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

      <Link href="/login" className="mt-6 text-center text-mint">
        Já tem conta? Entrar
      </Link>
    </KeyboardAvoidingView>
  );
}
