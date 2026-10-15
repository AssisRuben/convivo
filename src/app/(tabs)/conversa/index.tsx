import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiChatOverview, type ApiChatThreadSummary } from "@/lib/api";
import { ChatView } from "@/components/ChatView";
import { setChatUnread } from "@/lib/chatUnread";
import { dismissChatNotifications } from "@/lib/chatNotifications";

const POLL_MS = 5000;

function whenLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function ThreadRow({ thread, onPress }: { thread: ApiChatThreadSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-navy/5">
        <Text className="text-base font-bold text-navy">{thread.customerName.trim().charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className={`flex-1 text-sm text-navy ${thread.unread > 0 ? "font-bold" : "font-semibold"}`} numberOfLines={1}>
            {thread.customerName}
          </Text>
          <Text className={`text-xs ${thread.unread > 0 ? "font-semibold text-mint" : "text-navy/40"}`}>
            {whenLabel(thread.lastMessageAt)}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text className={`flex-1 text-xs ${thread.unread > 0 ? "text-navy" : "text-navy/50"}`} numberOfLines={1}>
            {thread.lastMessagePreview}
          </Text>
          {thread.unread > 0 && (
            <View className="min-w-5 items-center rounded-full bg-mint px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">{thread.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Aba Conversa. Cliente: o chat com a farmácia. Gestor: a lista de
 * conversas de todos os clientes (mais recente em cima). Enquanto a tela
 * está aberta, busca novidades a cada 5s.
 */
export default function ConversaScreen() {
  const router = useRouter();
  const [data, setData] = useState<ApiChatOverview | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/mobile/chat");
      if (!res.ok) {
        setFailed(true);
        return;
      }
      const json: ApiChatOverview = await res.json();
      setFailed(false);
      setData(json);
      // Cliente abriu = leu tudo; gestor: soma do que ainda falta abrir.
      setChatUnread(json.role === "gestor" ? json.threads.reduce((s, t) => s + t.unread, 0) : 0);
      // cliente com a conversa aberta: a notificação dela sai da barra
      if (json.role === "cliente") dismissChatNotifications();
    } catch {
      // sem rede: tenta de novo no próximo ciclo
      setFailed(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, POLL_MS);
      return () => clearInterval(timer);
    }, [load])
  );

  if (!data && failed) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-cream p-6">
        <Ionicons name="cloud-offline-outline" size={32} color="#0b1e3d60" />
        <Text className="text-center text-navy/60">Não foi possível carregar as conversas.</Text>
        <Pressable onPress={load} className="rounded-full bg-navy px-5 py-2.5">
          <Text className="text-sm font-semibold text-white">Tentar de novo</Text>
        </Pressable>
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

  if (data.role === "gestor") {
    return (
      <FlatList
        className="flex-1 bg-cream"
        contentContainerClassName="gap-2 p-4 pb-24"
        data={data.threads}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="chatbubbles" size={20} color="#2ec4b6" />
            <Text className="text-lg font-bold text-navy">Conversas com clientes</Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="mt-6 text-center text-sm text-navy/60">Nenhum cliente escreveu ainda.</Text>
        }
        renderItem={({ item }) => (
          <ThreadRow
            thread={item}
            onPress={() => router.push({ pathname: "/conversa/[threadId]", params: { threadId: item.id } })}
          />
        )}
      />
    );
  }

  return (
    <ChatView
      messages={data.messages}
      emptyTitle="Fale com a Farmácia Conviva"
      emptyText="Tire dúvidas sobre remédios, peça um orçamento ou combine uma entrega. Respondemos por aqui em horário comercial."
      onSend={async (text) => {
        const res = await apiFetch("/api/mobile/chat", { method: "POST", body: JSON.stringify({ text }) });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Não foi possível enviar");
        setData(json);
      }}
    />
  );
}
