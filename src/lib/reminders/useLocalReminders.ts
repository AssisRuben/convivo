import { useEffect } from "react";
import { AppState } from "react-native";
import { refreshLocalReminders, startLocalReminders } from "@/lib/reminders/localReminders";
import { getNotificationPermission, onNotificationsGranted } from "@/lib/push/notificationPermission";
import { pushSupported } from "@/lib/push/registerPushToken";

/**
 * Lembretes locais enquanto há alguém logado ((tabs)/_layout.tsx):
 * acompanha a Rotina e, a cada volta do app pra frente, reagenda (os que
 * já passaram saem, a janela de 7 dias anda; virou o dia, a lista de
 * ontem não vale e é buscada de novo). Se a pessoa ligou as notificações
 * nas configurações do celular enquanto estava fora, registra o token.
 */
export function useLocalReminders(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !pushSupported()) return;
    const stop = startLocalReminders();

    let wasGranted: boolean | null = null;
    getNotificationPermission().then((p) => {
      wasGranted = p === "granted";
    });

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      refreshLocalReminders();
      getNotificationPermission().then((p) => {
        const granted = p === "granted";
        if (granted && wasGranted === false) onNotificationsGranted();
        wasGranted = granted;
      });
    });

    return () => {
      sub.remove();
      stop();
    };
  }, [enabled]);
}
