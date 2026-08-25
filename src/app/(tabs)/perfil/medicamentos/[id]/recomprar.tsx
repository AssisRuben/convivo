import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { apiFetch, type ApiProfile } from "@/lib/api";
import { showAlert } from "@/lib/alert";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "12,50" ou "12.50" → 1250. Entrada inválida/vazia vira 0. */
function parseReaisToCents(text: string): number {
  const normalized = text.replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0;
}

type RecompraInfo = { productName: string; totalUnits: number; subtotalCents: number };

export default function RecomprarMedicamentoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [info, setInfo] = useState<RecompraInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [saldoCents, setSaldoCents] = useState(0);
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [discountInput, setDiscountInput] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/mobile/profile").then((res) => res.json() as Promise<{ profile: ApiProfile }>),
      apiFetch(`/api/mobile/medicamentos/${id}`).then(async (res) => ({
        ok: res.ok,
        data: (await res.json()) as RecompraInfo & { error?: string },
      })),
      apiFetch("/api/mobile/wallet").then((res) => res.json() as Promise<{ saldoCents: number }>),
    ])
      .then(([profileData, infoResult, walletData]) => {
        const p = profileData.profile;
        setCep(p.cep ?? "");
        setLogradouro(p.logradouro ?? "");
        setNumero(p.numero ?? "");
        setBairro(p.bairro ?? "");
        setCidade(p.cidade ?? "");
        setEstado(p.estado ?? "");

        if (infoResult.ok) {
          setInfo(infoResult.data);
        } else {
          setInfoError(infoResult.data?.error ?? "Não foi possível carregar esse medicamento");
        }
        setSaldoCents(walletData.saldoCents ?? 0);
      })
      .finally(() => setLoadingProfile(false));
  }, [id]);

  const subtotal = info?.subtotalCents ?? 0;
  const maxDiscountCents = Math.min(saldoCents, subtotal);
  const clampedDiscountCents = Math.min(
    Math.max(parseReaisToCents(discountInput), 0),
    maxDiscountCents
  );

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
          walletDiscountCents: clampedDiscountCents,
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

      {infoError && (
        <View className="rounded-2xl bg-coral/10 p-4">
          <Text className="text-sm text-coral">{infoError}</Text>
        </View>
      )}

      {info && (
        <View className="rounded-2xl bg-card p-4 shadow-sm">
          <Text className="mb-2 text-sm font-medium text-navy">Resumo do pedido</Text>
          <View className="flex-row justify-between">
            <Text className="text-navy/70">
              {info.totalUnits}x {info.productName}
            </Text>
            <Text className="text-navy/70">{formatPrice(info.subtotalCents)}</Text>
          </View>

          {maxDiscountCents > 0 && (
            <View className="mt-3">
              <Text className="mb-1 text-xs text-navy/50">
                Saldo disponível: {formatPrice(saldoCents)}
              </Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={discountInput}
                  onChangeText={setDiscountInput}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  className="flex-1 rounded-xl border border-navy/10 bg-cream p-2.5"
                />
                <Pressable
                  onPress={() =>
                    setDiscountInput((maxDiscountCents / 100).toFixed(2).replace(".", ","))
                  }
                  className="rounded-xl bg-mint/15 px-3 py-2.5"
                >
                  <Text className="text-sm font-medium text-mint">Usar máximo</Text>
                </Pressable>
              </View>
            </View>
          )}

          {clampedDiscountCents > 0 && (
            <View className="mt-3 flex-row justify-between">
              <Text className="text-coral">Desconto (saldo)</Text>
              <Text className="text-coral">-{formatPrice(clampedDiscountCents)}</Text>
            </View>
          )}

          <View className="mt-3 flex-row justify-between border-t border-navy/5 pt-3">
            <Text className="font-semibold text-navy">Total</Text>
            <Text className="font-semibold text-navy">
              {formatPrice(subtotal - clampedDiscountCents)}
            </Text>
          </View>
        </View>
      )}

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
        disabled={confirming || !info}
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
