import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { useCachedState } from "@/lib/useCachedState";
import { showAlert } from "@/lib/alert";
import QRCode from "react-native-qrcode-svg";
import { redeemQrValue } from "@/lib/wallet/walletRules";

type Overview = {
  balanceCents: number;
  minPurchaseCents: number;
  validityMonths: number;
  upcoming: { amountCents: number; expiresAt: string }[];
  entries: { id: string; description: string; amountCents: number; createdAt: string }[];
};

type CodeState =
  | { phase: "none" }
  | { phase: "showing"; code: string; expiresAt: string }
  | { phase: "used"; amountCents?: number; balanceCents: number };

const POLL_MS = 3000;

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function secondsLeft(iso: string, now: number): number {
  return Math.max(Math.round((new Date(iso).getTime() - now) / 1000), 0);
}

/**
 * Meus créditos: saldo, quando vence, extrato e "Usar no balcão" — gera
 * um código de 6 dígitos (10 min, uso único) que o atendente digita no
 * app dele. A tela acompanha o código e mostra o resgate assim que sai.
 */
export default function CarteiraScreen() {
  const [data, setData] = useCachedState<Overview>("tela:carteira");
  const [codeState, setCodeState] = useState<CodeState>({ phase: "none" });
  const [generating, setGenerating] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/mobile/carteira");
    if (res.ok) setData(await res.json());
  }, [setData]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Relógio do código e acompanhamento do resgate enquanto ele aparece.
  useEffect(() => {
    if (codeState.phase !== "showing") return;
    const code = codeState.code;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/mobile/carteira/codigo/${code}`);
        if (!res.ok) return;
        const status = await res.json();
        if (status.status === "used") {
          setCodeState({ phase: "used", amountCents: status.amountCents, balanceCents: status.balanceCents });
          load();
        } else if (status.status === "expired") {
          setCodeState({ phase: "none" });
        }
      } catch {
        // sem rede: tenta no próximo ciclo
      }
    }, POLL_MS);
    return () => {
      clearInterval(tick);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [codeState, load]);

  async function generateCode() {
    setGenerating(true);
    try {
      const res = await apiFetch("/api/mobile/carteira/codigo", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error);
      setNow(Date.now());
      setCodeState({ phase: "showing", code: json.code, expiresAt: json.expiresAt });
    } catch (error) {
      showAlert("Não foi possível gerar o código", error instanceof Error ? error.message : undefined);
    } finally {
      setGenerating(false);
    }
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const left = codeState.phase === "showing" ? secondsLeft(codeState.expiresAt, now) : 0;
  const soon = data.upcoming[0];

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-4 p-4 pb-24">
      <View className="items-center gap-1 rounded-3xl bg-navy p-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-white/60">Seu saldo</Text>
        <Text className="text-4xl font-extrabold text-white">{formatPrice(data.balanceCents)}</Text>
        <Text className="text-center text-xs text-white/60">
          Use como desconto em compras a partir de {formatPrice(data.minPurchaseCents)} — no balcão ou pelo app.
        </Text>
      </View>

      {codeState.phase === "showing" && left > 0 ? (
        <View className="items-center gap-2 rounded-3xl bg-card p-6 shadow-sm">
          <Text className="text-sm font-semibold text-navy">Mostre este QR ao atendente</Text>
          <View className="rounded-2xl bg-white p-3">
            <QRCode value={redeemQrValue(codeState.code)} size={210} color="#0b1e3d" backgroundColor="#ffffff" />
          </View>
          <Text className="text-xs text-navy/50">Se a leitura não funcionar, ele digita o código:</Text>
          <Text className="text-3xl font-extrabold tracking-[6px] text-navy">
            {codeState.code.slice(0, 3)} {codeState.code.slice(3)}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={14} color="#0b1e3d80" />
            <Text className="text-xs text-navy/60">
              Vale por {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} · uma vez só
            </Text>
          </View>
          <View className="mt-1 flex-row items-center gap-1.5">
            <ActivityIndicator size="small" color="#2ec4b6" />
            <Text className="text-xs text-navy/50">Aguardando o atendente confirmar…</Text>
          </View>
        </View>
      ) : codeState.phase === "used" ? (
        <View className="items-center gap-2 rounded-3xl bg-mint/15 p-6">
          <Ionicons name="checkmark-circle" size={40} color="#2ec4b6" />
          <Text className="text-base font-bold text-navy">
            {codeState.amountCents ? `${formatPrice(codeState.amountCents)} usados!` : "Crédito usado!"}
          </Text>
          <Text className="text-sm text-navy/70">Saldo agora: {formatPrice(codeState.balanceCents)}</Text>
          <Pressable onPress={() => setCodeState({ phase: "none" })} className="mt-1">
            <Text className="text-xs font-semibold text-mint underline">Fechar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={generating || data.balanceCents <= 0}
          onPress={generateCode}
          className="flex-row items-center justify-center gap-2 rounded-full bg-mint py-4 disabled:opacity-40"
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="storefront-outline" size={20} color="#fff" />
              <Text className="text-base font-semibold text-white">Usar no balcão</Text>
            </>
          )}
        </Pressable>
      )}

      <View className="gap-1.5 rounded-2xl bg-mint/10 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-mint">Como usar na farmácia</Text>
        <Text className="text-xs text-navy/70">1. No caixa, toque em “Usar no balcão”.</Text>
        <Text className="text-xs text-navy/70">2. Mostre o QR ao atendente — ele lê com o celular e confirma quanto vai usar.</Text>
        <Text className="text-xs text-navy/70">
          3. O desconto entra na hora. Compra mínima de {formatPrice(data.minPurchaseCents)}; dá pra usar parte do
          saldo e guardar o resto.
        </Text>
      </View>

      {soon && (
        <View className="flex-row items-start gap-2 rounded-2xl bg-amber-50 p-4">
          <Ionicons name="hourglass-outline" size={16} color="#92400e" />
          <Text className="flex-1 text-xs text-amber-800">
            {formatPrice(soon.amountCents)} vence em {formatDate(soon.expiresAt)}. Cada crédito vale por{" "}
            {data.validityMonths} meses — o mais antigo é usado primeiro.
          </Text>
        </View>
      )}

      <View className="gap-2">
        <Text className="text-sm font-bold text-navy">Extrato</Text>
        {data.entries.length === 0 ? (
          <Text className="text-sm text-navy/60">
            Nenhum crédito ainda. Você ganha com o cartão fidelidade, os pontos de cuidado e indicando amigos.
          </Text>
        ) : (
          data.entries.map((e) => (
            <View key={e.id} className="flex-row items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
              <Ionicons
                name={e.amountCents > 0 ? "arrow-down-circle" : "arrow-up-circle"}
                size={22}
                color={e.amountCents > 0 ? "#2ec4b6" : "#e63946"}
              />
              <View className="flex-1">
                <Text className="text-sm text-navy" numberOfLines={2}>
                  {e.description}
                </Text>
                <Text className="text-[11px] text-navy/50">{formatDate(e.createdAt)}</Text>
              </View>
              <Text className={`text-sm font-bold ${e.amountCents > 0 ? "text-mint" : "text-coral"}`}>
                {e.amountCents > 0 ? "+" : "−"}
                {formatPrice(Math.abs(e.amountCents))}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
