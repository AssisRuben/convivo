import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Conversa que está na tela agora — o handler de notificação em primeiro
 * plano (registerPushToken.ts) não mostra o push dela, já que a mensagem
 * chega na própria tela pela busca periódica. `"farmacia"` = cliente na
 * conversa dele com a farmácia (o push do cliente não tem threadId).
 */
let activeChat: string | null = null;

export function setActiveChat(chat: string | null): void {
  activeChat = chat;
}

/** Push do chat (`data` dele) é da conversa que está aberta? */
export function isChatOpen(data: { screen?: unknown; threadId?: unknown } | undefined): boolean {
  if (!activeChat || data?.screen !== "chat") return false;
  if (typeof data.threadId === "string") return data.threadId === activeChat;
  return activeChat === "farmacia";
}

/**
 * Abriu a conversa = leu: tira da barra de notificações a notificação do
 * chat (uma por conversa — ver replaceKey em lib/chat/chatCore.ts).
 * `threadId` ausente = todas do chat (cliente só tem uma conversa).
 * Mesmo cuidado do _layout: nada no web nem no Expo Go.
 */
export async function dismissChatNotifications(threadId?: string): Promise<void> {
  if (Platform.OS === "web") return;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  try {
    const Notifications = await import("expo-notifications");
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const notification of presented) {
      const data = notification.request.content.data as { screen?: string; threadId?: string } | undefined;
      if (data?.screen !== "chat") continue;
      if (threadId && data.threadId !== threadId) continue;
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  } catch {
    // sem permissão/módulo: não tem o que limpar
  }
}
