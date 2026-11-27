import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as TaskManager from "expo-task-manager";
import type { NotificationResponse } from "expo-notifications";
import { handleReminderAction } from "@/lib/reminders/reminderActions";

/**
 * Tarefa que o Android roda quando a pessoa toca num botão do lembrete
 * ("Já tomei", "Daqui 15 min") com o app em segundo plano ou fechado.
 * Precisa ser definida no topo do bundle, antes de qualquer tela — por
 * isso é importada pelo index.ts (o ponto de entrada), não pelo _layout:
 * com o app fechado, o sistema sobe só o JS, sem montar navegação.
 */
export const REMINDER_ACTION_TASK = "convivo-reminder-action";

const supported =
  Platform.OS === "android" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

if (supported) {
  TaskManager.defineTask<Record<string, unknown>>(REMINDER_ACTION_TASK, async ({ data, error }) => {
    if (error || !data || !("actionIdentifier" in data)) return;
    try {
      await handleReminderAction(data as unknown as NotificationResponse);
    } catch (taskError) {
      console.warn("[lembretes] ação da notificação falhou:", taskError);
    }
  });
}

/** Liga a tarefa no expo-notifications (uma vez; só Android). */
export async function registerReminderActionTask(Notifications: typeof import("expo-notifications")): Promise<void> {
  if (!supported) return;
  if (await TaskManager.isTaskRegisteredAsync(REMINDER_ACTION_TASK)) return;
  await Notifications.registerTaskAsync(REMINDER_ACTION_TASK);
}
