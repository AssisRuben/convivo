import { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import { showAlert } from "@/lib/alert";
import { getItemAsync, setItemAsync } from "@/lib/storage";
import { NOTIFICATION_ASK_SNOOZE_KEY } from "@/lib/storageKeys";
import { registerPushToken, setupNotifications } from "@/lib/push/registerPushToken";
import { resyncLocalReminders } from "@/lib/reminders/localReminders";

/**
 * - granted: liberado
 * - undetermined: dá pra pedir (nunca pediu, ou o Android ainda deixa)
 * - blocked: o sistema não mostra mais o pedido — só nas configurações
 * - unsupported: web / Expo Go
 */
export type NotificationPermission = "granted" | "undetermined" | "blocked" | "unsupported";

export async function getNotificationPermission(): Promise<NotificationPermission> {
  try {
    const Notifications = await setupNotifications();
    if (!Notifications) return "unsupported";
    const status = await Notifications.getPermissionsAsync();
    if (status.granted) return "granted";
    return status.canAskAgain ? "undetermined" : "blocked";
  } catch {
    return "unsupported";
  }
}

export type NotificationReason = "lembrete" | "cuidador" | "chat";

const REASONS: Record<NotificationReason, { title: string; message: string }> = {
  lembrete: {
    title: "Quer ser lembrado na hora?",
    message: "A gente avisa no horário de cada cuidado — e não avisa o que você já marcou como feito.",
  },
  cuidador: {
    title: "Avisar quando uma dose for esquecida?",
    message: "Se a pessoa que você acompanha não marcar o remédio, você recebe um aviso no celular.",
  },
  chat: {
    title: "Avisar quando a farmácia responder?",
    message: "Assim você não precisa ficar abrindo o app pra ver se chegou resposta.",
  },
};

// "Agora não" na explicação: não pergunta de novo por uns dias (o pedido
// do sistema nem chegou a aparecer, então dá pra perguntar de novo).
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

function confirm(title: string, message: string, confirmText: string): Promise<boolean> {
  return new Promise((resolve) => {
    showAlert(title, message, [
      { text: "Agora não", style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, onPress: () => resolve(true) },
    ]);
  });
}

/**
 * Pede a permissão de notificação na hora em que ela faz sentido, com uma
 * explicação ANTES do pedido do sistema — no iOS, um "não" ali é
 * definitivo (só volta pelas configurações). Liberou → registra o token e
 * agenda os lembretes. Devolve se ficou liberado.
 *
 * `force`: o próprio usuário tocou em "Ativar" (ignora o "Agora não"
 * recente e, se estiver bloqueado, oferece abrir as configurações).
 */
export async function askForNotifications(
  reason: NotificationReason,
  { force = false }: { force?: boolean } = {}
): Promise<boolean> {
  const permission = await getNotificationPermission();
  if (permission === "granted") return true;
  if (permission === "unsupported") return false;

  if (permission === "blocked") {
    if (force) {
      const open = await confirm(
        "Notificações desligadas",
        "Elas foram desligadas nas configurações do celular. Abra as configurações do app e ative as notificações.",
        "Abrir configurações"
      );
      if (open) Linking.openSettings().catch(() => {});
    }
    return false;
  }

  if (!force) {
    const snoozedAt = Number((await getItemAsync(NOTIFICATION_ASK_SNOOZE_KEY)) ?? 0);
    if (Date.now() - snoozedAt < SNOOZE_MS) return false;
  }

  const { title, message } = REASONS[reason];
  const accepted = await confirm(title, message, "Ativar");
  if (!accepted) {
    await setItemAsync(NOTIFICATION_ASK_SNOOZE_KEY, String(Date.now())).catch(() => {});
    return false;
  }

  try {
    const Notifications = await setupNotifications();
    if (!Notifications) return false;
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return false;
  } catch {
    return false;
  }
  await onNotificationsGranted();
  return true;
}

/** Acabou de liberar (aqui ou nas configurações do celular). */
export async function onNotificationsGranted(): Promise<void> {
  await registerPushToken();
  await resyncLocalReminders();
}

/**
 * Estado da permissão pra mostrar na tela (ex.: aviso "Lembretes
 * desligados" na Rotina) — confere de novo quando o app volta pra frente,
 * que é quando a pessoa pode ter mudado nas configurações.
 */
export function useNotificationPermission(): { permission: NotificationPermission | null; refresh: () => void } {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const refresh = useCallback(() => {
    getNotificationPermission().then(setPermission);
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  return { permission, refresh };
}
