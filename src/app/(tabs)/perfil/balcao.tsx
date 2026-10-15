import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { parseMoneyToCents, validateRedemption } from "@/lib/wallet/walletRules";
import { QrScannerModal } from "@/components/QrScannerModal";

type Lookup = { customerName: string; balanceCents: number; minPurchaseCents: number };
type Redemption = {
  id: string;
  customerName: string;
  staffName: string;
  amountCents: number;
  purchaseCents: number;
  saleNumber: string | null;
  createdAt: string;
  reversed: boolean;
};
type Today = { items: Redemption[]; totalCents: number; canReverse: boolean };

const CREAM = "#fafaf7"; // cream do tailwind.config.js

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Resgatar créditos (atendente/gestor): digita o código que o cliente
 * mostra, confere nome e saldo, informa a compra e quanto usar, confirma.
 * O débito sai na hora; o atendente dá o mesmo desconto na Trier. Embaixo,
 * os resgates do dia (gestor vê todos e pode estornar).
 */
export default function BalcaoScreen() {
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [purchase, setPurchase] = useState("");
  const [amount, setAmount] = useState("");
  const [saleNumber, setSaleNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ customerName: string; amountCents: number; balanceCents: number } | null>(null);
  const [today, setToday] = useState<Today | null>(null);
  const [scanning, setScanning] = useState(false);

  const loadToday = useCallback(async () => {
    const res = await apiFetch("/api/mobile/balcao/resgates");
    if (res.ok) setToday(await res.json());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [loadToday])
  );

  function reset() {
    setCode("");
    setLookup(null);
    setPurchase("");
    setAmount("");
    setSaleNumber("");
    setDone(null);
  }

  async function consult(value: string = code) {
    setBusy(true);
    try {
      const res = await apiFetch("/api/mobile/balcao/consultar", { method: "POST", body: JSON.stringify({ code: value }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error);
      setLookup(json);
      setAmount("");
    } catch (error) {
      showAlert("Código", error instanceof Error ? error.message : "Não foi possível consultar");
    } finally {
      setBusy(false);
    }
  }

  // Valor da compra digitado: sugere usar o que der (saldo ou a compra toda).
  function onPurchaseChange(value: string) {
    setPurchase(value);
    const cents = parseMoneyToCents(value);
    if (lookup && cents != null) setAmount(centsToInput(Math.min(lookup.balanceCents, cents)));
  }

  function confirm() {
    if (!lookup) return;
    const purchaseCents = parseMoneyToCents(purchase) ?? 0;
    const amountCents = parseMoneyToCents(amount) ?? 0;
    const error = validateRedemption({ purchaseCents, amountCents, balanceCents: lookup.balanceCents });
    if (error) {
      showAlert("Confira os valores", error);
      return;
    }
    showAlert(
      "Confirmar resgate",
      `Usar ${formatPrice(amountCents)} do saldo de ${lookup.customerName} numa compra de ${formatPrice(purchaseCents)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => redeem(purchaseCents, amountCents) },
      ]
    );
  }

  async function redeem(purchaseCents: number, amountCents: number) {
    setBusy(true);
    try {
      const res = await apiFetch("/api/mobile/balcao/resgatar", {
        method: "POST",
        body: JSON.stringify({ code, purchaseCents, amountCents, saleNumber: saleNumber.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error);
      setDone(json);
      loadToday();
    } catch (error) {
      showAlert("Não foi possível resgatar", error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  function confirmReverse(r: Redemption) {
    showAlert("Estornar resgate", `Devolver ${formatPrice(r.amountCents)} pro saldo de ${r.customerName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Estornar",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/api/mobile/balcao/resgates/${r.id}/estornar`, { method: "POST" });
          const json = await res.json();
          if (res.ok) setToday(json);
          else showAlert("Não foi possível estornar", json?.error);
        },
      },
    ]);
  }

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      style={{ flex: 1, backgroundColor: CREAM }}
      contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name="storefront" size={20} color="#2ec4b6" />
        <Text className="text-lg font-bold text-navy">Resgatar créditos</Text>
      </View>

      {done ? (
        <View className="items-center gap-2 rounded-3xl bg-mint/15 p-6">
          <Ionicons name="checkmark-circle" size={44} color="#2ec4b6" />
          <Text className="text-center text-base font-bold text-navy">
            Dê {formatPrice(done.amountCents)} de desconto na Trier
          </Text>
          <Text className="text-center text-sm text-navy/70">
            Resgate de {done.customerName} confirmado. Saldo que ficou: {formatPrice(done.balanceCents)}.
          </Text>
          <Pressable onPress={reset} className="mt-2 rounded-full bg-navy px-6 py-3">
            <Text className="font-semibold text-white">Novo resgate</Text>
          </Pressable>
        </View>
      ) : !lookup ? (
        <View className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
          <Text className="text-sm text-navy/70">
            Peça pro cliente abrir Menu › Meus créditos › Usar no balcão e leia o QR que aparece.
          </Text>
          <Pressable
            disabled={busy}
            onPress={() => setScanning(true)}
            className="flex-row items-center justify-center gap-2 rounded-full bg-mint py-4 disabled:opacity-40"
          >
            <Ionicons name="qr-code-outline" size={22} color="#fff" />
            <Text className="text-base font-semibold text-white">Ler QR do cliente</Text>
          </Pressable>
          <Text className="text-center text-xs text-navy/50">ou digite os 6 números</Text>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            placeholder="000 000"
            keyboardType="number-pad"
            maxLength={6}
            className="rounded-xl border border-navy/10 bg-cream p-3 text-center text-3xl font-bold tracking-[8px] text-navy"
          />
          <Pressable
            disabled={busy || code.length !== 6}
            onPress={() => consult()}
            className="items-center rounded-full bg-navy py-3.5 disabled:opacity-40"
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Consultar</Text>}
          </Pressable>
        </View>
      ) : (
        <View className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-mint/15">
              <Ionicons name="person" size={20} color="#2ec4b6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-navy">{lookup.customerName}</Text>
              <Text className="text-sm text-navy/70">
                Saldo: <Text className="font-bold text-mint">{formatPrice(lookup.balanceCents)}</Text>
              </Text>
            </View>
            <Pressable onPress={reset} hitSlop={8}>
              <Text className="text-xs text-navy/50 underline">Trocar</Text>
            </Pressable>
          </View>

          <View className="gap-1">
            <Text className="text-sm font-medium text-navy">Valor da compra</Text>
            <TextInput
              value={purchase}
              onChangeText={onPurchaseChange}
              placeholder="0,00"
              keyboardType="decimal-pad"
              className="rounded-xl border border-navy/10 bg-cream p-3 text-lg text-navy"
            />
            <Text className="text-xs text-navy/50">Mínimo de {formatPrice(lookup.minPurchaseCents)} pra usar crédito.</Text>
          </View>

          <View className="gap-1">
            <Text className="text-sm font-medium text-navy">Usar de crédito</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              keyboardType="decimal-pad"
              className="rounded-xl border border-navy/10 bg-cream p-3 text-lg text-navy"
            />
            <Text className="text-xs text-navy/50">Pode ser parte do saldo — o resto fica guardado.</Text>
          </View>

          <View className="gap-1">
            <Text className="text-sm font-medium text-navy">Nº da venda na Trier (opcional)</Text>
            <TextInput
              value={saleNumber}
              onChangeText={setSaleNumber}
              placeholder="Ex.: 112387"
              keyboardType="number-pad"
              className="rounded-xl border border-navy/10 bg-cream p-3 text-navy"
            />
          </View>

          <Pressable
            disabled={busy}
            onPress={confirm}
            className="mt-1 items-center rounded-full bg-mint py-3.5 disabled:opacity-40"
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Confirmar resgate</Text>}
          </Pressable>
        </View>
      )}

      {today && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-navy">
              Resgates de hoje{today.canReverse ? "" : " (seus)"}
            </Text>
            <Text className="text-sm font-bold text-navy">{formatPrice(today.totalCents)}</Text>
          </View>
          {today.items.length === 0 ? (
            <Text className="text-sm text-navy/60">Nenhum resgate hoje.</Text>
          ) : (
            today.items.map((r) => (
              <View key={r.id} className={`gap-1 rounded-2xl bg-card p-3 shadow-sm ${r.reversed ? "opacity-50" : ""}`}>
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-sm font-semibold text-navy" numberOfLines={1}>
                    {r.customerName}
                  </Text>
                  <Text className={`text-sm font-bold ${r.reversed ? "text-navy/50 line-through" : "text-coral"}`}>
                    −{formatPrice(r.amountCents)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-navy/50">
                    {timeLabel(r.createdAt)} · compra {formatPrice(r.purchaseCents)}
                    {r.saleNumber ? ` · venda ${r.saleNumber}` : ""}
                    {today.canReverse ? ` · ${r.staffName.split(" ")[0]}` : ""}
                    {r.reversed ? " · estornado" : ""}
                  </Text>
                  {today.canReverse && !r.reversed && (
                    <Pressable onPress={() => confirmReverse(r)} hitSlop={8}>
                      <Text className="text-xs font-semibold text-coral">Estornar</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}
      <QrScannerModal
        visible={scanning}
        onClose={() => setScanning(false)}
        onCode={(value) => {
          setScanning(false);
          setCode(value);
          consult(value);
        }}
      />
    </KeyboardAwareScrollView>
  );
}
