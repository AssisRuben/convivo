import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { apiFetch } from "@/lib/api";
import { deleteItemAsync, getItemAsync, setItemAsync } from "@/lib/storage";
import { PUSH_TOKEN_KEY } from "@/lib/storageKeys";
import { isChatOpen } from "@/lib/chatNotifications";

/**
 * O que esta versão do app sabe fazer com push — vai junto com o token e
 * o servidor decide o que mandar pra cada aparelho (ex.: canal Android
 * novo só pra quem já tem o canal criado). Vazio por enquanto; cada etapa
 * nova acrescenta a sua.
 */
const PUSH_CAPABILITIES: string[] = [];

function pushSupported(): boolean {
  if (Platform.OS === "web") return false;
  // Expo Go: ver nota em registerPushToken
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

let tokenListenerAttached = false;

async function sendTokenToServer(token: string): Promise<void> {
  const res = await apiFetch("/api/mobile/push-token", {
    method: "POST",
    body: JSON.stringify({ token, capabilities: PUSH_CAPABILITIES }),
  });
  // Guarda pro logout saber qual token desligar (unregisterPushToken).
  if (res.ok) await setItemAsync(PUSH_TOKEN_KEY, token);
}

/**
 * Pede permissão e registra o token de push da Expo no backend — só faz
 * sentido em dispositivo real (Expo push não existe no preview web usado
 * pra testar este projeto, por isso o guard de Platform). Nunca lança:
 * falha aqui não pode travar login/cadastro.
 *
 * `expo-notifications` é importado dinamicamente aqui dentro, não no topo
 * do arquivo — o módulo tem efeito colateral no próprio import (registra
 * um listener de token sozinho), e desde o SDK 53 o Expo Go no Android
 * não suporta mais isso (removido, só funciona em development build) —
 * só o import já derrubava o app inteiro no Expo Go antes de qualquer
 * checagem em runtime ter chance de rodar.
 */
export async function registerPushToken(): Promise<void> {
  if (!pushSupported()) return;

  try {
    const Notifications = await import("expo-notifications");

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

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Convivo",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let status = existingStatus;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") {
      console.warn("[push] permissão de notificação negada");
      return;
    }

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
