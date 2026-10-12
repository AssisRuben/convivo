import { useRef, useState } from "react";
import { FlatList, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import type { ApiChatMessage } from "@/lib/api";
import { showAlert } from "@/lib/alert";

const MAX_LENGTH = 2000;
const CREAM = "#fafaf7"; // cream do tailwind.config.js
// Cabeçalho padrão do Stack (o do app não muda a altura).
const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;

/** Mensagem na tela: as do servidor e as que acabaram de ser enviadas e
 * ainda estão salvando (ou falharam). */
type DisplayMessage = ApiChatMessage & { status?: "sending" | "failed" };

const PENDING_MATCH_MS = 2 * 60 * 1000;

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return "Hoje";
  if (sameDay(date, yesterday)) return "Ontem";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function timeLabel(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Conversa (cliente com a farmácia, ou gestor com um cliente): bolhas com
 * dia e hora, e o campo de envio que sobe com o teclado. Quem usa cuida
 * de buscar as mensagens e de enviar (`onSend`).
 */
export function ChatView({
  messages,
  onSend,
  emptyTitle,
  emptyText,
}: {
  messages: ApiChatMessage[];
  onSend: (text: string) => Promise<void>;
  emptyTitle: string;
  emptyText: string;
}) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<DisplayMessage[]>([]);
  const listRef = useRef<FlatList<DisplayMessage>>(null);
  const tempSeq = useRef(0);

  // Envio otimista: a bolha aparece na hora (com relógio) e o campo já
  // limpa; o servidor salva em segundo plano. Deu certo, a lista do
  // servidor traz a mensagem e a provisória some; deu errado, fica
  // vermelha pra tocar e tentar de novo.
  async function deliver(item: DisplayMessage) {
    setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "sending" } : p)));
    try {
      await onSend(item.text);
      setPending((prev) => prev.filter((p) => p.id !== item.id));
    } catch (error) {
      setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "failed" } : p)));
      showAlert("Não foi possível enviar", error instanceof Error ? error.message : "Toque na mensagem pra tentar de novo.");
    }
  }

  function send() {
    const value = text.trim();
    if (!value) return;
    tempSeq.current += 1;
    const item: DisplayMessage = {
      id: `tmp-${Date.now()}-${tempSeq.current}`,
      text: value,
      createdAt: new Date().toISOString(),
      mine: true,
      status: "sending",
    };
    setPending((prev) => [...prev, item]);
    setText("");
    deliver(item);
  }

  // A busca periódica pode trazer a mensagem antes da resposta do envio:
  // a provisória com o mesmo texto já salvo some, sem aparecer duplicada.
  const visiblePending = pending.filter(
    (p) =>
      p.status === "failed" ||
      !messages.some(
        (m) =>
          m.mine &&
          m.text === p.text &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(p.createdAt).getTime()) < PENDING_MATCH_MS
      )
  );
  const all: DisplayMessage[] = [...messages, ...visiblePending];
  // Lista invertida: a mensagem mais nova fica embaixo e a rolagem já
  // começa no fim, sem precisar rolar depois de carregar.
  const reversed = [...all].reverse();

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={insets.top + HEADER_HEIGHT}
      // componente de fora do NativeWind: className não chega nele
      style={{ flex: 1, backgroundColor: CREAM }}
    >
      {all.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-mint/15">
            <Ionicons name="chatbubbles" size={30} color="#2ec4b6" />
          </View>
          <Text className="text-center text-base font-bold text-navy">{emptyTitle}</Text>
          <Text className="text-center text-sm text-navy/60">{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={reversed}
          inverted
          className="flex-1"
          keyExtractor={(m) => m.id}
          contentContainerClassName="gap-1.5 px-3 py-3"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => {
            const date = new Date(item.createdAt);
            // Lista invertida: o "anterior" na tela é o próximo do array.
            const older = reversed[index + 1];
            const showDay = !older || !sameDay(new Date(older.createdAt), date);
            return (
              <View>
                {showDay && (
                  <Text className="my-2 self-center rounded-full bg-navy/5 px-3 py-1 text-[11px] font-medium text-navy/60">
                    {dayLabel(date)}
                  </Text>
                )}
                <Pressable
                  disabled={item.status !== "failed"}
                  onPress={() => deliver(item)}
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    item.mine ? "self-end rounded-br-md" : "self-start rounded-bl-md bg-card shadow-sm"
                  } ${item.mine ? (item.status === "failed" ? "bg-coral" : "bg-navy") : ""}`}
                >
                  <Text className={`text-[15px] ${item.mine ? "text-white" : "text-navy"}`}>{item.text}</Text>
                  <View className="mt-0.5 flex-row items-center gap-1 self-end">
                    <Text className={`text-[10px] ${item.mine ? "text-white/70" : "text-navy/40"}`}>
                      {item.status === "failed" ? "Não enviada · toque pra tentar de novo" : timeLabel(date)}
                    </Text>
                    {item.mine && item.status !== "failed" && (
                      <Ionicons
                        name={item.status === "sending" ? "time-outline" : "checkmark"}
                        size={11}
                        color="#ffffffb0"
                      />
                    )}
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <View className="flex-row items-end gap-2 border-t border-navy/5 bg-card px-3 py-2">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escreva sua mensagem…"
          multiline
          maxLength={MAX_LENGTH}
          className="max-h-32 flex-1 rounded-2xl bg-cream px-4 py-2.5 text-[15px] text-navy"
        />
        <Pressable
          onPress={send}
          disabled={!text.trim()}
          accessibilityLabel="Enviar"
          className="h-11 w-11 items-center justify-center rounded-full bg-mint disabled:opacity-40"
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
