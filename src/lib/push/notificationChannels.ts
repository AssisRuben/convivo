import { Platform } from "react-native";
import type { PushChannel } from "@/lib/reminders/reminderText";

type NotificationsModule = typeof import("expo-notifications");

/**
 * Canais Android: cada tipo de aviso no seu, pra pessoa poder silenciar
 * as novidades sem perder o lembrete do remédio (antes era tudo num canal
 * só, com importância máxima). A importância de um canal não muda depois
 * de criado — pra mudar, é preciso um id novo. O "default" fica pros
 * pushes de servidor que não mandam canal (app antigo).
 *
 * No Android 13+, os canais precisam existir ANTES de pedir a permissão,
 * senão o pedido nem aparece.
 */
const CHANNELS: { id: PushChannel; name: string; description: string; importance: "MAX" | "HIGH" | "DEFAULT" | "LOW" }[] = [
  { id: "lembretes", name: "Lembretes de cuidado", description: "Remédios e cuidados da sua rotina, na hora marcada", importance: "HIGH" },
  { id: "cuidador", name: "Alertas de quem você cuida", description: "Dose não marcada por alguém da família", importance: "MAX" },
  { id: "chat", name: "Conversa com a farmácia", description: "Mensagens novas", importance: "HIGH" },
  { id: "conta", name: "Carteira e fidelidade", description: "Créditos, selos e resgates", importance: "DEFAULT" },
  { id: "novidades", name: "Dicas e leituras", description: "Pílulas de sabedoria, Gotas de Fé e dicas das suas metas", importance: "LOW" },
];

let created = false;

export async function ensureNotificationChannels(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== "android" || created) return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Convivo",
    importance: Notifications.AndroidImportance.MAX,
  });
  for (const channel of CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      description: channel.description,
      importance: Notifications.AndroidImportance[channel.importance],
    });
  }
  created = true;
}
