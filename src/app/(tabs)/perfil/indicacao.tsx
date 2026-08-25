import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function IndicacaoScreen() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [saldoCents, setSaldoCents] = useState(0);
  const [hasReferrer, setHasReferrer] = useState(true);
  const [hasVendedor, setHasVendedor] = useState(true);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [linking, setLinking] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/indicacao");
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode);
        setReferralCount(data.referralCount ?? 0);
        setSaldoCents(data.saldoCents ?? 0);
        setHasReferrer(Boolean(data.hasReferrer));
        setHasVendedor(Boolean(data.hasVendedor));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleLinkCode() {
    const code = codeInput.trim();
    if (!code) return;
    setLinking(true);
    try {
      const res = await apiFetch("/api/mobile/vincular-codigo", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert("Não foi possível vincular", data.error);
        return;
      }
      setCodeInput("");
      showAlert(
        "Código vinculado!",
        data.kind === "vendedor"
          ? "Vendedor vinculado à sua conta."
          : "Amigo vinculado à sua conta."
      );
      load();
    } finally {
      setLinking(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      load();
    }, [load])
  );

  function handleShare() {
    if (!referralCode) return;
    Share.share({
      message: `Baixe o Convivo e use meu código de indicação "${referralCode}" no cadastro!`,
    });
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-24">
      <View className="items-center rounded-2xl bg-navy px-6 py-6">
        <Ionicons name="gift-outline" size={26} color="#fff" />
        <Text className="mt-1 text-lg font-semibold text-white">Indique e Ganhe</Text>
        <Text className="mt-1 text-center text-xs text-white/70">
          Compartilhe seu código. Quando um amigo se cadastrar com ele, você acumula crédito
          pra usar nas próximas compras.
        </Text>
      </View>

      <Text className="mb-2 mt-5 text-sm font-medium text-navy">Seu código de indicação</Text>
      <View className="flex-row items-center justify-between rounded-2xl bg-card p-4 shadow-sm">
        <Text className="text-xl font-bold tracking-widest text-navy">{referralCode}</Text>
        <Pressable
          onPress={handleShare}
          className="flex-row items-center gap-1.5 rounded-full bg-mint/15 px-3 py-2"
        >
          <Ionicons name="share-social-outline" size={16} color="#2ec4b6" />
          <Text className="text-sm font-medium text-mint">Compartilhar</Text>
        </Pressable>
      </View>

      <View className="mt-6 flex-row gap-4">
        <View className="flex-1 items-center gap-1 rounded-2xl bg-card p-5 shadow-sm">
          <Ionicons name="people-outline" size={22} color="#2ec4b6" />
          <Text className="text-2xl font-bold text-navy">{referralCount}</Text>
          <Text className="text-center text-xs text-navy/60">amigo(s) indicado(s)</Text>
        </View>
        <View className="flex-1 items-center gap-1 rounded-2xl bg-card p-5 shadow-sm">
          <Ionicons name="sparkles-outline" size={22} color="#2ec4b6" />
          <Text className="text-2xl font-bold text-navy">{formatPrice(saldoCents)}</Text>
          <Text className="text-center text-xs text-navy/60">seu saldo de créditos</Text>
        </View>
      </View>

      <Text className="mt-6 text-center text-xs text-navy/50">
        Você ganha 2% da margem toda vez que um amigo indicado compra — não só na primeira
        compra. O uso desse saldo nas suas próprias compras ainda está sendo configurado.
      </Text>

      {(!hasReferrer || !hasVendedor) && (
        <View className="mt-6 rounded-2xl bg-card p-4 shadow-sm">
          <Text className="mb-2 text-sm font-medium text-navy">
            Tem um código de amigo ou de vendedor?
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              value={codeInput}
              onChangeText={setCodeInput}
              placeholder="Código"
              autoCapitalize="characters"
              className="flex-1 rounded-xl border border-navy/10 bg-cream p-3"
            />
            <Pressable
              disabled={linking || !codeInput.trim()}
              onPress={handleLinkCode}
              className="items-center justify-center rounded-xl bg-navy px-4 disabled:opacity-50"
            >
              {linking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">Vincular</Text>
              )}
            </Pressable>
          </View>
          <Text className="mt-2 text-xs text-navy/50">
            {hasReferrer
              ? "Você já tem um amigo vinculado — pode adicionar um código de vendedor."
              : hasVendedor
                ? "Você já tem um vendedor vinculado — pode adicionar o código de um amigo."
                : "Vale código de amigo ou de vendedor da farmácia — cada um só pode ser vinculado uma vez."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
