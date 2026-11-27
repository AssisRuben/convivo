import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "@/lib/prisma";
import { pushUrlFor } from "@/lib/push/pushRoutes";
import type { PushChannel } from "@/lib/reminders/reminderText";

const expo = new Expo();

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Mesma chave = substitui a notificação anterior em vez de empilhar
   * (padrão WhatsApp: uma por conversa). Android: tag; iOS: collapseId. */
  replaceKey?: string;
  /** Canal Android — só vai pra aparelho com "channels-v1" (os antigos não
   * têm o canal criado e caem no "default" de sempre). */
  channel?: PushChannel;
};

export type PushTokenInfo = { capabilities: string[]; localRemindersUntil: Date | null };

export type SendPushOptions = {
  /** true = não manda pra este aparelho (ex.: ele já agendou o lembrete). */
  skipToken?: (token: PushTokenInfo) => boolean;
};

/**
 * Envia push pra todos os tokens salvos do usuário — nunca lança (best
 * effort, igual o registro na Trier). Remove na hora os tokens que a Expo
 * já recusa no envio (`DeviceNotRegistered`); o resto dos tickets fica
 * guardado pra checkPushReceipts conferir o recibo de entrega depois.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  options: SendPushOptions = {}
): Promise<void> {
  const tokens = await prisma.expoPushToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  // `url` pro app novo navegar direto; `screen` continua pros antigos.
  const url = pushUrlFor(payload.data);
  const data = url ? { ...payload.data, url } : payload.data;

  const messages: ExpoPushMessage[] = [];
  for (const row of tokens) {
    if (!Expo.isExpoPushToken(row.token)) continue;
    if (options.skipToken?.(row)) continue;
    const withChannel = payload.channel && row.capabilities.includes("channels-v1");
    messages.push({
      to: row.token,
      sound: "default",
      title: payload.title,
      body: payload.body,
      data,
      ...(withChannel ? { channelId: payload.channel } : {}),
      ...(payload.replaceKey ? { tag: payload.replaceKey, collapseId: payload.replaceKey } : {}),
    });
  }
  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  const invalidTokens: string[] = [];
  const tickets: { id: string; token: string }[] = [];

  for (const chunk of chunks) {
    try {
      const result = await expo.sendPushNotificationsAsync(chunk);
      result.forEach((ticket, i) => {
        const token = chunk[i].to as string;
        if (ticket.status === "ok") tickets.push({ id: ticket.id, token });
        else if (ticket.details?.error === "DeviceNotRegistered") invalidTokens.push(token);
      });
    } catch {
      // Falha de rede/API da Expo — não interrompe o resto do disparo.
    }
  }

  try {
    if (invalidTokens.length > 0) {
      await prisma.expoPushToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
    if (tickets.length > 0) {
      await prisma.pushTicket.createMany({ data: tickets, skipDuplicates: true });
    }
  } catch (error) {
    console.error("[push] falha ao guardar tickets/limpar tokens:", error);
  }
}

// A Expo só garante o recibo ~15 min depois do envio e apaga em 24h.
const RECEIPT_WAIT_MS = 15 * 60 * 1000;
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const RECEIPTS_PER_RUN = 3000;

/**
 * Cron: confere os recibos dos pushes enviados há mais de 15 min e apaga
 * os tokens que a Expo diz que não existem mais (`DeviceNotRegistered` —
 * app desinstalado, token trocado). Ticket com recibo respondido sai da
 * fila; sem recibo ainda, fica pra próxima rodada até vencer as 24h.
 * Devolve quantos tokens foram removidos.
 */
export async function checkPushReceipts(now: Date = new Date()): Promise<number> {
  await prisma.pushTicket.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - RECEIPT_TTL_MS) } } });

  const pending = await prisma.pushTicket.findMany({
    where: { createdAt: { lt: new Date(now.getTime() - RECEIPT_WAIT_MS) } },
    orderBy: { createdAt: "asc" },
    take: RECEIPTS_PER_RUN,
  });
  if (pending.length === 0) return 0;

  const tokenByTicket = new Map(pending.map((t) => [t.id, t.token]));
  const answered: string[] = [];
  const invalidTokens = new Set<string>();

  for (const ids of expo.chunkPushNotificationReceiptIds(pending.map((t) => t.id))) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(ids);
      for (const [id, receipt] of Object.entries(receipts)) {
        answered.push(id);
        if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
          const token = tokenByTicket.get(id);
          if (token) invalidTokens.add(token);
        }
      }
    } catch {
      // API da Expo fora: tenta de novo na próxima rodada.
    }
  }

  if (invalidTokens.size > 0) {
    await prisma.expoPushToken.deleteMany({ where: { token: { in: [...invalidTokens] } } });
  }
  if (answered.length > 0) {
    await prisma.pushTicket.deleteMany({ where: { id: { in: answered } } });
  }
  return invalidTokens.size;
}
