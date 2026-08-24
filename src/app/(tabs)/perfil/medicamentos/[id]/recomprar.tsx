import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { apiFetch, type ApiProfile } from "@/lib/api";
import { showAlert } from "@/lib/alert";

export default function RecomprarMedicamentoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    apiFetch("/api/mobile/profile")
      .then((res) => res.json())
      .then((data: { profile: ApiProfile }) => {
        const p = data.profile;
        setCep(p.cep ?? "");
        setLogradouro(p.logradouro ?? "");
        setNumero(p.numero ?? "");
        setBairro(p.bairro ?? "");
        setCidade(p.cidade ?? "");
        setEstado(p.estado ?? "");
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  async function handleConfirm() {
    setConfirming(true);
    try {
      const res = await apiFetch(`/api/mobile/medicamentos/${id}/recomprar`, {
        method: "POST",
        body: JSON.stringify({
          fulfillmentType,
          address:
            fulfillmentType === "DELIVERY"
              ? { cep, logradouro, numero, bairro, cidade, estado }
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível confirmar a compra");
      router.replace({ pathname: "/perfil/pedidos/[id]", params: { id: data.order.id } });
    } catch (error) {
      showAlert("Erro ao confirmar", error instanceof Error ? error.message : undefined);
    } finally {
      setConfirming(false);
    }
  }

  if (loadingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-3 p-4 pb-24">
      <Text className="text-lg font-bold text-navy">Confirmar recompra</Text>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setFulfillmentType("PICKUP")}
          className={`flex-1 items-center rounded-xl py-3 ${
            fulfillmentType === "PICKUP" ? "bg-navy" : "bg-navy/5"
          }`}
        >
          <Text className={fulfillmentType === "PICKUP" ? "font-semibold text-white" : "text-navy/70"}>
            Retirar na loja
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFulfillmentType("DELIVERY")}
          className={`flex-1 items-center rounded-xl py-3 ${
            fulfillmentType === "DELIVERY" ? "bg-navy" : "bg-navy/5"
          }`}
        >
          <Text className={fulfillmentType === "DELIVERY" ? "font-semibold text-white" : "text-navy/70"}>
            Entrega
          </Text>
        </Pressable>
      </View>

      {fulfillmentType === "DELIVERY" && (
        <View className="gap-2 rounded-2xl bg-card p-4 shadow-sm">
          <Text className="text-sm font-medium text-navy">Endereço de entrega</Text>
          <TextInput
            value={cep}
            onChangeText={setCep}
            placeholder="CEP"
            className="rounded-xl border border-navy/10 p-3"
          />
          <TextInput
            value={logradouro}
            onChangeText={setLogradouro}
            placeholder="Rua"
            className="rounded-xl border border-navy/10 p-3"
          />
          <View className="flex-row gap-2">
            <TextInput
              value={numero}
              onChangeText={setNumero}
              placeholder="Número"
              className="flex-1 rounded-xl border border-navy/10 p-3"
            />
            <TextInput
              value={bairro}
              onChangeText={setBairro}
              placeholder="Bairro"
              className="flex-1 rounded-xl border border-navy/10 p-3"
            />
          </View>
          <View className="flex-row gap-2">
            <TextInput
              value={cidade}
              onChangeText={setCidade}
              placeholder="Cidade"
              className="flex-1 rounded-xl border border-navy/10 p-3"
            />
            <TextInput
              value={estado}
              onChangeText={setEstado}
              placeholder="UF"
              className="w-16 rounded-xl border border-navy/10 p-3"
            />
          </View>
        </View>
      )}

      <View className="rounded-2xl bg-card p-4 shadow-sm">
        <Text className="text-sm font-medium text-navy">Forma de pagamento</Text>
        <Text className="mt-1 text-xs text-navy/50">
          Pagamento online ainda não está disponível — o pedido é registrado e confirmado
          direto com a farmácia.
        </Text>
      </View>

      <Pressable
        disabled={confirming}
        onPress={handleConfirm}
        className="mt-2 items-center rounded-full bg-navy py-3.5 disabled:opacity-50"
      >
        {confirming ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-semibold text-white">Confirmar pedido</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
