import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { apiFetch } from "@/lib/api";

/**
 * Selo de não lidas da aba Conversa. Um valor só no app inteiro: a barra
 * de abas lê, e a tela de conversa zera ao abrir (sem esperar a próxima
 * consulta).
 */
let unread = 0;
const listeners = new Set<(n: number) => void>();

export function setChatUnread(n: number): void {
  unread = n;
  listeners.forEach((l) => l(n));
}

export async function refreshChatUnread(): Promise<void> {
  try {
    const res = await apiFetch("/api/mobile/chat/unread");
    if (res.ok) setChatUnread((await res.json()).unread ?? 0);
  } catch {
    // sem rede: mantém o último valor
  }
}

const REFRESH_MS = 30_000;

/** Pra barra de abas: consulta ao abrir, a cada 30s e ao voltar pro app. */
export function useChatUnread(enabled: boolean): number {
  const [value, setValue] = useState(unread);

  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refreshChatUnread();
    const timer = setInterval(refreshChatUnread, REFRESH_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshChatUnread();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled]);

  return value;
}
