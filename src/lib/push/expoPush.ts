import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "@/lib/prisma";

const expo = new Expo();

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Envia push pra todos os tokens salvos do usuário — nunca lança (best
 * effort, igual o registro na Trier). Remove tokens que a Expo reporta
 * como definitivamente inválidos (`DeviceNotRegistered`), pra não ficar
 * tentando de novo pra sempre.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const tokens = await prisma.expoPushToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = [];
  for (const { token } of tokens) {
    if (!Expo.isExpoPushToken(token)) continue;
    messages.push({
      to: token,
      sound: "default",
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
  }
  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  const invalidTokens: string[] = [];

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(chunk[i].to as string);
        }
      });
    } catch {
      // Falha de rede/API da Expo — não interrompe o resto do disparo.
    }
  }

  if (invalidTokens.length > 0) {
    await prisma.expoPushToken.deleteMany({ where: { token: { in: invalidTokens } } });
  }
}
