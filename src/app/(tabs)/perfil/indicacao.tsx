import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { useCodeOwner } from "@/lib/useCodeOwner";
import { CodeOwnerHint } from "@/components/CodeOwnerHint";
import { APP_DOWNLOAD_URL } from "@/constants/appLinks";

type CodeOwner = { name: string; kind: "amigo" | "vendedor" };

type Overview = {
  userName: string;
  referralCode: string;
  referralCount: number;
  saldoCents: number;
  linked: (CodeOwner & { code: string }) | null;
  friends: { name: string; since: string }[];
};

const CREAM = "#fafaf7"; // cream do tailwind.config.js

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export default function IndicacaoScreen() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [linking, setLinking] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const loadedOnce = useRef(false);
  const owner = useCodeOwner(codeInput);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/mobile/indicacao");
    if (res.ok) setData(await res.json());
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      load();
    }, [load])
  );

  async function handleLinkCode() {
    const code = codeInput.trim();
    if (!code) return;
    setLinking(true);
    try {
      const res = await apiFetch("/api/mobile/vincular-codigo", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        showAlert("Não foi possível vincular", json.error);
        return;
      }
      setCodeInput("");
      // servidor antigo devolve só { ok, kind }: busca a tela de novo
      if (json.referralCode) setData(json);
      else load();
      showAlert(
        "Código vinculado!",
        json.linked ? `Agora você usa o código de ${json.linked.name}` : undefined
      );
    } finally {
      setLinking(false);
    }
  }

  function confirmUnlink() {
    if (!data?.linked) return;
    showAlert(
      "Remover código",
      `Remover o código de ${data.linked.name}? Depois você pode vincular outro código.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const res = await apiFetch("/api/mobile/vincular-codigo", { method: "DELETE" });
            if (res.ok) setData(await res.json());
            else showAlert("Não foi possível remover", "Tente de novo em instantes.");
          },
        },
      ]
    );
  }

  // Duas mensagens: o convite e, separado, só o código — no WhatsApp a
  // pessoa segura a mensagem do código e copia inteiro, sem catar no meio
  // do texto (o app não tem "copiar" nativo sem um APK novo).
  async function handleShare() {
    if (!data) return;
    const name = firstName(data.userName);
    await Share.share({
      message:
        `${name} te convidou para o Convivo, o app da Farmácia Conviva 💚\n\n` +
        `Lembrete dos remédios, cartão fidelidade e conversa direta com a farmácia.\n\n` +
        `Baixe aqui: ${APP_DOWNLOAD_URL}\n\n` +
        `No cadastro, use o código de indicação que vou mandar na próxima mensagem. ` +
        `Se você já tem conta, coloque em Menu › Indique e Ganhe.`,
    }).catch(() => {});
    showAlert("Agora envie o código", "Mande o código numa mensagem separada — assim seu amigo só copia e cola.", [
      { text: "Depois", style: "cancel" },
      { text: "Enviar código", onPress: () => Share.share({ message: data.referralCode }).catch(() => {}) },
    ]);
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <>
      {/* Rola até o campo quando o teclado abre (componente de fora do
          NativeWind: estilo direto). */}
      <KeyboardAwareScrollView
        bottomOffset={24}
        style={{ flex: 1, backgroundColor: CREAM }}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center rounded-2xl bg-navy px-6 py-6">
          <Ionicons name="gift-outline" size={26} color="#fff" />
          <Text className="mt-1 text-lg font-semibold text-white">Indique e Ganhe</Text>
          <Text className="mt-1 text-center text-xs text-white/70">
            Compartilhe seu código. Toda vez que um amigo indicado comprar, você ganha crédito pra usar
            nas suas compras.
          </Text>
        </View>

        <View className="mt-4 gap-1.5 rounded-2xl bg-mint/10 p-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-mint">Como funciona</Text>
          <Text className="text-xs text-navy/70">
            • O código vale para quem <Text className="font-semibold">vai se cadastrar</Text> (no campo
            “Código de indicação”) e para quem <Text className="font-semibold">já tem conta</Text> (aqui,
            em “Tem um código?”).
          </Text>
          <Text className="text-xs text-navy/70">
            • Cada cliente usa um código por vez. Dá pra remover e trocar por outro.
          </Text>
        </View>

        <Text className="mb-2 mt-5 text-sm font-medium text-navy">Seu código de indicação</Text>
        <View className="flex-row items-center justify-between rounded-2xl bg-card p-4 shadow-sm">
          <Text selectable className="text-xl font-bold tracking-widest text-navy">
            {data.referralCode}
          </Text>
          <Pressable
            onPress={handleShare}
            className="flex-row items-center gap-1.5 rounded-full bg-mint/15 px-3 py-2"
          >
            <Ionicons name="share-social-outline" size={16} color="#2ec4b6" />
            <Text className="text-sm font-medium text-mint">Compartilhar</Text>
          </Pressable>
        </View>
        <Text className="mt-1.5 text-xs text-navy/50">
          Vão duas mensagens: o convite com seu nome e, separado, só o código.
        </Text>

        <View className="mt-6 flex-row gap-4">
          <Pressable
            onPress={() => setShowFriends(true)}
            className="flex-1 items-center gap-1 rounded-2xl bg-card p-5 shadow-sm"
          >
            <Ionicons name="people-outline" size={22} color="#2ec4b6" />
            <Text className="text-2xl font-bold text-navy">{data.referralCount}</Text>
            <Text className="text-center text-xs text-navy/60">
              amigo{data.referralCount === 1 ? "" : "s"} indicado{data.referralCount === 1 ? "" : "s"}
            </Text>
            <Text className="text-[11px] font-semibold text-mint">Ver lista ›</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/perfil/carteira")}
            className="flex-1 items-center gap-1 rounded-2xl bg-card p-5 shadow-sm"
          >
            <Ionicons name="sparkles-outline" size={22} color="#2ec4b6" />
            <Text className="text-2xl font-bold text-navy">{formatPrice(data.saldoCents)}</Text>
            <Text className="text-center text-xs text-navy/60">seu saldo de créditos</Text>
            <Text className="text-[11px] font-semibold text-mint">Usar ›</Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-xs text-navy/50">
          Você ganha 2% da margem toda vez que um amigo indicado compra — não só na primeira compra. O
          saldo vira desconto nas suas compras pelo app.
        </Text>

        <View className="mt-6 rounded-2xl bg-card p-4 shadow-sm">
          {data.linked ? (
            <>
              <Text className="mb-2 text-sm font-medium text-navy">Código que você usa</Text>
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-mint/15">
                  <Ionicons name={data.linked.kind === "vendedor" ? "storefront-outline" : "person-outline"} size={18} color="#2ec4b6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-navy">
                    {data.linked.name}
                    {data.linked.kind === "vendedor" ? " · vendedor da farmácia" : ""}
                  </Text>
                  <Text className="text-xs tracking-widest text-navy/50">{data.linked.code}</Text>
                </View>
                <Pressable onPress={confirmUnlink} hitSlop={8}>
                  <Text className="text-xs font-semibold text-coral">Remover</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text className="mb-2 text-sm font-medium text-navy">Tem um código?</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={codeInput}
                  onChangeText={setCodeInput}
                  placeholder="Cole ou digite o código"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  className="flex-1 rounded-xl border border-navy/10 bg-cream p-3 tracking-widest"
                />
                <Pressable
                  disabled={linking || owner.status !== "found"}
                  onPress={handleLinkCode}
                  className="items-center justify-center rounded-xl bg-navy px-4 disabled:opacity-50"
                >
                  {linking ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Vincular</Text>}
                </Pressable>
              </View>
              <View className="mt-2">
                <CodeOwnerHint state={owner} />
              </View>
              <Text className="mt-2 text-xs text-navy/50">
                Código de um amigo ou de um vendedor da farmácia. Você usa um por vez.
              </Text>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>

      <Modal visible={showFriends} transparent animationType="fade" onRequestClose={() => setShowFriends(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowFriends(false)}>
          <Pressable className="max-h-[75%] gap-3 rounded-t-3xl bg-cream p-5 pb-10" onPress={() => {}}>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-navy">Amigos indicados ({data.referralCount})</Text>
              <Pressable onPress={() => setShowFriends(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#0b1e3d" />
              </Pressable>
            </View>
            {data.friends.length === 0 ? (
              <Text className="py-6 text-center text-sm text-navy/60">
                Ninguém usou seu código ainda. Compartilhe e acompanhe por aqui.
              </Text>
            ) : (
              <ScrollView contentContainerClassName="gap-2">
                {data.friends.map((friend, i) => (
                  <View key={`${friend.name}-${i}`} className="flex-row items-center gap-3 rounded-2xl bg-card p-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-mint/15">
                      <Text className="text-sm font-bold text-mint">{friend.name.charAt(0)}</Text>
                    </View>
                    <Text className="flex-1 text-sm font-medium text-navy">{friend.name}</Text>
                    <Text className="text-xs text-navy/50">desde {formatDate(friend.since)}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
