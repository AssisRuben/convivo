import { useCallback, useState } from "react";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { apiFetch, type ApiChatThread } from "@/lib/api";
import { ChatView } from "@/components/ChatView";
import { refreshChatUnread } from "@/lib/chatUnread";
import { dismissChatNotifications } from "@/lib/chatNotifications";

const POLL_MS = 5000;

/** Gestor: a conversa com um cliente, respondendo em nome da farmácia. */
export default function ConversaClienteScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const [data, setData] = useState<ApiChatThread | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/mobile/chat/${threadId}`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        setError(json?.error ?? "Não foi possível abrir a conversa");
        return;
      }
      setError(null);
      setData(json);
      // conversa aberta: a notificação dela sai da barra
      dismissChatNotifications(threadId);
    } catch {
      // sem rede: tenta de novo no próximo ciclo
      setError((current) => current ?? "Sem conexão. Tentando de novo…");
    }
  }, [threadId]);

  useFocusEffect(
    useCallback(() => {
      load().then(refreshChatUnread);
      const timer = setInterval(load, POLL_MS);
      return () => clearInterval(timer);
    }, [load])
  );

  if (error && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-cream p-6">
        <Text className="text-center text-navy/60">{error}</Text>
      </View>
    );
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
      <Stack.Screen options={{ headerTitle: data.customerName }} />
      <ChatView
        messages={data.messages}
        emptyTitle={data.customerName}
        emptyText="Nenhuma mensagem ainda."
        onSend={async (text) => {
          const res = await apiFetch(`/api/mobile/chat/${threadId}`, {
            method: "POST",
            body: JSON.stringify({ text }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error ?? "Não foi possível enviar");
          setData(json);
        }}
      />
    </>
  );
}
