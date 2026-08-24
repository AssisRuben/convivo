import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { apiFetch } from "@/lib/api";

/**
 * Pede permissão e registra o token de push da Expo no backend — só faz
 * sentido em dispositivo real (Expo push não existe no preview web usado
 * pra testar este projeto, por isso o guard de Platform). Nunca lança:
 * falha aqui não pode travar login/cadastro.
 */
export async function registerPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
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
    if (status !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return; // sem projeto EAS configurado ainda

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiFetch("/api/mobile/push-token", { method: "POST", body: JSON.stringify({ token }) });
  } catch {
    // Best-effort — sem permissão, sem EAS configurado, etc. não deve
    // quebrar o fluxo de login.
  }
}
