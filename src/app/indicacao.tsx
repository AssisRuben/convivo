import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";

export default function IndicacaoScreen() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/indicacao");
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode);
        setReferralCount(data.referralCount ?? 0);
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
    <View className="flex-1 bg-cream p-4">
      <View className="items-center rounded-2xl bg-navy px-6 py-6">
        <Ionicons name="gift-outline" size={26} color="#e63946" />
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
          <Ionicons name="sparkles-outline" size={22} color="#e63946" />
          <Text className="text-2xl font-bold text-navy">Em breve</Text>
          <Text className="text-center text-xs text-navy/60">seu saldo de créditos</Text>
        </View>
      </View>

      <Text className="mt-6 text-center text-xs text-navy/50">
        O crédito por indicação ainda está sendo configurado — em breve você vai poder
        acompanhar e usar seu saldo aqui.
      </Text>
    </View>
  );
}
