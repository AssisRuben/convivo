import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { apiFetch } from "@/lib/api";
import { deleteItemAsync, getItemAsync, setItemAsync } from "@/lib/storage";
import { PUSH_TOKEN_KEY } from "@/lib/storageKeys";
import { isChatOpen } from "@/lib/chatNotifications";
import { ensureNotificationChannels } from "@/lib/push/notificationChannels";

/**
 * O que esta versão do app sabe fazer com push — vai junto com o token e
 * o servidor decide o que mandar pra cada aparelho:
 * - channels-v1: canais Android novos criados (notificationChannels.ts)
 * - local-reminders-v1: agenda os lembretes de rotina no próprio celular
 *   (lib/reminders/localReminders.ts) e informa até que dia
 */
const PUSH_CAPABILITIES = ["channels-v1", "local-reminders-v1"];

/**
 * Web não tem push; Expo Go também não — `expo-notifications` é importado
 * dinamicamente em todo lugar (nunca no topo do arquivo) porque o módulo
 * tem efeito colateral no próprio import (registra um listener de token
 * sozinho), e desde o SDK 53 o Expo Go no Android não suporta mais isso:
 * só o import já derrubava o app inteiro antes de qualquer checagem.
 */
export function pushSupported(): boolean {
  if (Platform.OS === "web") return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

let handlerInstalled = false;

/** Handler do push com o app aberto + canais — antes de qualquer pedido
 * de permissão (Android 13 exige os canais criados antes). */
export async function setupNotifications(): Promise<typeof import("expo-notifications") | null> {
  if (!pushSupported()) return null;
  const Notifications = await import("expo-notifications");
  if (!handlerInstalled) {
    handlerInstalled = true;
    // Sem isso o push recebido com o app aberto é descartado em silêncio.
    // Exceção: mensagem da conversa que já está na tela — ela aparece ali
    // mesmo, o banner por cima só atrapalha.
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const show = !isChatOpen(notification.request.content.data as { screen?: unknown; threadId?: unknown });
        return {
          shouldShowBanner: show,
          shouldShowList: show,
          shouldPlaySound: show,
          shouldSetBadge: false,
        };
      },
    });
  }
  await ensureNotificationChannels(Notifications);
  return Notifications;
}

// Até que dia os lembretes locais estão agendados — undefined = ainda não
// calculado nesta abertura do app (não manda nada, o servidor mantém o que
// tinha). Ver reportLocalRemindersUntil.
let localRemindersUntil: string | null | undefined;
let lastSentUntil: string | null | undefined;

let tokenListenerAttached = false;

async function sendTokenToServer(token: string): Promise<void> {
  const until = localRemindersUntil;
  const res = await apiFetch("/api/mobile/push-token", {
    method: "POST",
    body: JSON.stringify({
      token,
      capabilities: PUSH_CAPABILITIES,
      ...(until !== undefined ? { localRemindersUntil: until } : {}),
    }),
  });
  if (res.ok) {
    // Guarda pro logout saber qual token desligar (unregisterPushToken).
    await setItemAsync(PUSH_TOKEN_KEY, token);
    if (until !== undefined) lastSentUntil = until;
  }
}

/**
 * Registra o token de push da Expo no backend — só se a permissão JÁ foi
 * dada. Pedir a permissão é com askForNotifications
 * (notificationPermission.ts), na hora em que faz sentido (criou um
 * lembrete, virou cuidador...), com explicação antes: no iOS um "não" no
 * pedido do sistema é definitivo. Nunca lança: falha aqui não pode travar
 * login/cadastro.
 */
export async function registerPushToken(): Promise<void> {
  try {
    const Notifications = await setupNotifications();
    if (!Notifications) return;

    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn("[push] sem extra.eas.projectId no app.json");
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await sendTokenToServer(token);

    // O sistema pode trocar o token (reinstalação do FCM, restauração de
    // backup no iOS): sem isso o servidor ficava mandando pro antigo. O
    // evento traz o token do aparelho; o da Expo sai dele de novo.
    if (!tokenListenerAttached) {
      tokenListenerAttached = true;
      Notifications.addPushTokenListener(() => {
        Notifications.getExpoPushTokenAsync({ projectId })
          .then(({ data }) => sendTokenToServer(data))
          .catch((error) => console.warn("[push] falha ao atualizar o token:", error));
      });
    }
  } catch (error) {
    // Best-effort — não deve quebrar o fluxo de login, mas o motivo fica no
    // log (antes a falha do FCM era totalmente silenciosa).
    console.warn("[push] falha ao registrar o token:", error);
  }
}

/**
 * Lembretes locais reagendados: conta pro servidor até que dia este
 * aparelho já está coberto (o lembrete de reserva dele pula esses dias).
 * Só manda quando muda. Sem token registrado ainda, vai junto no próximo
 * registro.
 */
export async function reportLocalRemindersUntil(until: string | null): Promise<void> {
  localRemindersUntil = until;
  if (until === lastSentUntil) return;
  try {
    const token = await getItemAsync(PUSH_TOKEN_KEY);
    if (token) await sendTokenToServer(token);
  } catch (error) {
    console.warn("[push] falha ao informar os lembretes agendados:", error);
  }
}

const UNREGISTER_TIMEOUT_MS = 4000;

/**
 * Logout: avisa o servidor pra parar de mandar push desta conta pra este
 * aparelho (antes, depois de sair, o celular seguia recebendo chat e
 * lembretes da conta anterior até alguém entrar de novo). Precisa rodar
 * ANTES de apagar o login — a rota exige estar autenticado. Nunca lança e
 * não segura o logout mais que alguns segundos sem internet.
 */
export async function unregisterPushToken(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const token = await getItemAsync(PUSH_TOKEN_KEY);
    if (!token) return;
    await Promise.race([
      apiFetch("/api/mobile/push-token", { method: "DELETE", body: JSON.stringify({ token }) }),
      new Promise((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.warn("[push] falha ao desligar o token:", error);
  } finally {
    await deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
  }
}

/** Troca de conta: o estado do agendamento era da conta anterior. */
export function resetPushSession(): void {
  localRemindersUntil = undefined;
  lastSentUntil = undefined;
}
