import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

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
