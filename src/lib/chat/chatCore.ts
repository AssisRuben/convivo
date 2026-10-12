import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/expoPush";

/**
 * Chat cliente <-> farmácia (aba Conversa). Cada cliente tem uma conversa
 * só; quem responde é qualquer conta com isGestor, sempre em nome da
 * farmácia (o cliente não vê qual gestor respondeu).
 */

export const MAX_MESSAGE_LENGTH = 2000;
const MESSAGES_PAGE = 200;
const PREVIEW_LENGTH = 120;
const STAFF_DISPLAY_NAME = "Farmácia Conviva";

export type ChatMessageView = {
  id: string;
  text: string;
  createdAt: string;
  /** Mandada por quem está vendo a conversa. */
  mine: boolean;
};

export type ChatThreadSummary = {
  id: string;
  customerName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unread: number;
};

export function normalizeMessage(raw: unknown): string {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) throw new Error("Escreva uma mensagem");
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Mensagem muito longa (máximo ${MAX_MESSAGE_LENGTH} caracteres)`);
  }
  return text;
}

export function previewOf(text: string): string {
  const flat = text.replace(/\s+/g, " ");
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…` : flat;
}

export async function isGestor(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isGestor: true } });
  return Boolean(user?.isGestor);
}

async function requireGestor(userId: string): Promise<void> {
  if (!(await isGestor(userId))) throw new Error("Sem permissão");
}

async function loadMessages(threadId: string, viewerIsStaff: boolean): Promise<ChatMessageView[]> {
  // As últimas N, devolvidas em ordem cronológica.
  const rows = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    take: MESSAGES_PAGE,
  });
  return rows.reverse().map((m) => ({
    id: m.id,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
    mine: m.fromStaff === viewerIsStaff,
  }));
}

// ---------- lado do cliente ----------

/** A conversa do cliente com a farmácia; abrir zera as não lidas dele. */
export async function getCustomerChat(userId: string): Promise<{ messages: ChatMessageView[] }> {
  const thread = await prisma.chatThread.findUnique({ where: { customerId: userId } });
  if (!thread) return { messages: [] };
  if (thread.customerUnread > 0) {
    await prisma.chatThread.update({ where: { id: thread.id }, data: { customerUnread: 0 } });
  }
  return { messages: await loadMessages(thread.id, false) };
}

export async function sendCustomerMessage(userId: string, rawText: string): Promise<void> {
  const text = normalizeMessage(rawText);
  const now = new Date();
  const thread = await prisma.chatThread.upsert({
    where: { customerId: userId },
    create: { customerId: userId, lastMessageAt: now, lastMessagePreview: previewOf(text), staffUnread: 1 },
    update: { lastMessageAt: now, lastMessagePreview: previewOf(text), staffUnread: { increment: 1 } },
    include: { customer: { select: { name: true } } },
  });
  await prisma.chatMessage.create({
    data: { threadId: thread.id, senderId: userId, fromStaff: false, text, createdAt: now },
  });

  // Avisa todos os gestores (em segundo plano: push não segura o envio).
  void (async () => {
    const gestores = await prisma.user.findMany({
      where: { isGestor: true, deletedAt: null, id: { not: userId } },
      select: { id: true },
    });
    for (const gestor of gestores) {
      await sendPushToUser(gestor.id, {
        title: `💬 ${thread.customer.name}`,
        body: previewOf(text),
        data: { screen: "chat", threadId: thread.id },
      });
    }
  })().catch((error) => console.error("[chat] push pros gestores:", error));
}

// ---------- lado do gestor ----------

export async function listThreadsForStaff(userId: string): Promise<ChatThreadSummary[]> {
  await requireGestor(userId);
  const threads = await prisma.chatThread.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 200,
    include: { customer: { select: { name: true } } },
  });
  return threads.map((t) => ({
    id: t.id,
    customerName: t.customer.name,
    lastMessageAt: t.lastMessageAt.toISOString(),
    lastMessagePreview: t.lastMessagePreview,
    unread: t.staffUnread,
  }));
}

/** Uma conversa vista pelo gestor; abrir zera as não lidas da farmácia. */
export async function getThreadForStaff(
  userId: string,
  threadId: string
): Promise<{ customerName: string; messages: ChatMessageView[] }> {
  await requireGestor(userId);
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: { customer: { select: { name: true } } },
  });
  if (!thread) throw new Error("Conversa não encontrada");
  if (thread.staffUnread > 0) {
    await prisma.chatThread.update({ where: { id: threadId }, data: { staffUnread: 0 } });
  }
  return { customerName: thread.customer.name, messages: await loadMessages(threadId, true) };
}

export async function sendStaffMessage(userId: string, threadId: string, rawText: string): Promise<void> {
  await requireGestor(userId);
  const text = normalizeMessage(rawText);
  const now = new Date();
  const thread = await prisma.chatThread.update({
    where: { id: threadId },
    data: { lastMessageAt: now, lastMessagePreview: previewOf(text), customerUnread: { increment: 1 } },
  });
  await prisma.chatMessage.create({
    data: { threadId, senderId: userId, fromStaff: true, text, createdAt: now },
  });
  void sendPushToUser(thread.customerId, {
    title: `💬 ${STAFF_DISPLAY_NAME}`,
    body: previewOf(text),
    data: { screen: "chat" },
  }).catch((error) => console.error("[chat] push pro cliente:", error));
}

/** Selo da aba: não lidas do cliente, ou de todas as conversas pro gestor. */
export async function getChatUnread(userId: string): Promise<number> {
  if (await isGestor(userId)) {
    const sum = await prisma.chatThread.aggregate({ _sum: { staffUnread: true } });
    return sum._sum.staffUnread ?? 0;
  }
  const thread = await prisma.chatThread.findUnique({
    where: { customerId: userId },
    select: { customerUnread: true },
  });
  return thread?.customerUnread ?? 0;
}
