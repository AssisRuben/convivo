import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";

type ApiPurchaseHistoryItem = {
  itemId: string;
  vendaId: string;
  dataEmissao: string;
  codigoProduto: number;
  nomeProduto: string;
  quantidade: number;
  valorTotalLiquidoCents: number;
  nomeVendedor: string | null;
};

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function HistoricoComprasScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ApiPurchaseHistoryItem[]>([]);
  const [needsContactInfo, setNeedsContactInfo] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/historico-compras");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setNeedsContactInfo(Boolean(data.needsContactInfo));
        setNeedsVerification(Boolean(data.needsVerification));
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  if (needsContactInfo) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-cream p-6">
        <Ionicons name="document-text-outline" size={32} color="#0b1e3d60" />
        <Text className="text-center text-navy/70">
          Cadastre seu CPF e telefone em Meus dados pra ver seu histórico de compras na
          farmácia.
        </Text>
        <Pressable
          onPress={() => router.push("/perfil/meus-dados")}
          className="mt-2 rounded-full bg-navy px-5 py-2.5"
        >
          <Text className="font-semibold text-white">Ir pra Meus dados</Text>
        </Pressable>
      </View>
    );
  }

  if (needsVerification) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-cream p-6">
        <Ionicons name="shield-checkmark-outline" size={32} color="#0b1e3d60" />
        <Text className="text-center text-navy/70">
          Por segurança, seu histórico só libera depois de confirmar que o CPF e o telefone
          cadastrados são mesmo seus — o telefone precisa bater com o que a farmácia já tem no
          cadastro.
        </Text>
        <Pressable
          onPress={() => router.push("/perfil/meus-dados")}
          className="mt-2 rounded-full bg-navy px-5 py-2.5"
        >
          <Text className="font-semibold text-white">Conferir CPF e telefone</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-cream"
      data={items}
      keyExtractor={(item) => item.itemId}
      contentContainerClassName="gap-2 p-4 pb-24"
      ListEmptyComponent={
        <Text className="mt-8 text-center text-navy/60">
          Nenhuma compra encontrada com o CPF ou telefone cadastrados.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/perfil/medicamentos/configurar",
              params: {
                nomeProduto: item.nomeProduto,
                codigoProduto: String(item.codigoProduto),
                dataEmissao: item.dataEmissao,
                quantidade: String(item.quantidade),
              },
            })
          }
          className="flex-row items-center justify-between rounded-2xl bg-card p-4 shadow-sm"
        >
          <View className="flex-1 pr-3">
            <Text className="font-medium text-navy">{item.nomeProduto}</Text>
            <Text className="text-xs text-navy/50">
              {formatDate(item.dataEmissao)} · {item.quantidade}x
            </Text>
          </View>
          <Text className="font-semibold text-navy">
            {formatPrice(item.valorTotalLiquidoCents)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#0b1e3d40" className="ml-2" />
        </Pressable>
      )}
    />
  );
}
