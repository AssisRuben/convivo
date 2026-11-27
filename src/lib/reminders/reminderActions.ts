import { Platform } from "react-native";
import type { NotificationResponse } from "expo-notifications";
import { apiFetch } from "@/lib/api";
import { getItemAsync, setItemAsync } from "@/lib/storage";
import { PENDING_REMINDER_ACTIONS_KEY } from "@/lib/storageKeys";
import { invalidateCached, setCached } from "@/lib/tabDataCache";
import { HOME_CACHE_KEY, ROTINA_CACHE_KEY } from "@/lib/tabPrefetch";
import { localDayKey } from "@/lib/reminders/localRemindersCore";

type NotificationsModule = typeof import("expo-notifications");

/**
 * Botões na própria notificação do lembrete: "✅ Já tomei" / "✅ Feito"
 * marca o cuidado sem abrir o app, "⏰ Daqui 15 min" lembra de novo.
 *
 * Android: a ação roda em segundo plano, mesmo com o app fechado (tarefa
 * em reminderActionTask.ts, carregada no index.ts). iOS: o Expo só roda
 * tarefa em segundo plano pra push remoto, não pra botão — lá o botão
 * abre o app, que marca e mostra a Rotina (ver _layout.tsx).
 *
 * As duas pontas podem receber a mesma ação (listener com o app aberto e
 * a tarefa): marcar é idempotente no servidor (upsert + ponto com chave
 * única) e o "adiar" usa id fixo, então repetir não duplica nada.
 */

export const DOSE_CATEGORY = "dose"; // sem "-" nem ":" (regra do Expo)
export const CARE_CATEGORY = "cuidado";
export const ACTION_DONE = "feito";
export const ACTION_SNOOZE = "adiar";
export const SNOOZE_PREFIX = "adiar_";
const SNOOZE_MINUTES = 15;

/** Dados que todo lembrete (local ou de reserva do servidor) carrega. */
export type ReminderData = { kind?: unknown; itemId?: unknown; dayKey?: unknown };

const foreground = Platform.OS === "ios";
let categoriesRegistered = false;

export async function registerReminderCategories(Notifications: NotificationsModule): Promise<void> {
  if (categoriesRegistered || Platform.OS === "web") return;
  categoriesRegistered = true;
  const snooze = {
    identifier: ACTION_SNOOZE,
    buttonTitle: `⏰ Daqui ${SNOOZE_MINUTES} min`,
    options: { opensAppToForeground: foreground },
  };
  await Notifications.setNotificationCategoryAsync(DOSE_CATEGORY, [
    { identifier: ACTION_DONE, buttonTitle: "✅ Já tomei", options: { opensAppToForeground: foreground } },
    snooze,
  ]);
  await Notifications.setNotificationCategoryAsync(CARE_CATEGORY, [
    { identifier: ACTION_DONE, buttonTitle: "✅ Feito", options: { opensAppToForeground: foreground } },
    snooze,
  ]);
}

const handled = new Set<string>();

/**
 * Trata o toque num botão de lembrete. Devolve true se era um (e quem
 * chamou não precisa fazer mais nada além de, no iOS, mostrar a Rotina).
 */
export async function handleReminderAction(response: NotificationResponse): Promise<boolean> {
  const action = response.actionIdentifier;
  if (action !== ACTION_DONE && action !== ACTION_SNOOZE) return false;
  const request = response.notification.request;
  const data = request.content.data as ReminderData | undefined;
  if (typeof data?.itemId !== "string" || typeof data.dayKey !== "string") return false;

  const key = `${request.identifier}:${action}`;
  if (handled.has(key)) return true;
  handled.add(key);

  const Notifications = await import("expo-notifications");
  // Botão no Android não fecha a notificação sozinho.
  await Notifications.dismissNotificationAsync(request.identifier).catch(() => {});

  if (action === ACTION_SNOOZE) {
    await Notifications.scheduleNotificationAsync({
      // id fixo por item e dia: adiar de novo troca o anterior
      identifier: `${SNOOZE_PREFIX}${data.itemId}_${data.dayKey}`,
      content: {
        title: request.content.title ?? "Hora de cuidar de você 💊",
        body: request.content.body ?? "",
        sound: "default",
        data: request.content.data,
        categoryIdentifier: request.content.categoryIdentifier ?? CARE_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: Date.now() + SNOOZE_MINUTES * 60 * 1000,
        channelId: "lembretes",
      },
    });
    return true;
  }

  // Lembrete de outro dia (ficou na barra desde ontem): marcar agora
  // contaria pra hoje — só fecha.
  if (data.dayKey !== localDayKey(new Date())) return true;
  await completeFromNotification(data.itemId);
  return true;
}

type CompleteResult = "ok" | "retry" | "drop";

async function postComplete(itemId: string): Promise<CompleteResult> {
  try {
    const res = await apiFetch(`/api/mobile/rotina/${encodeURIComponent(itemId)}/complete`, { method: "POST" });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      // A resposta já traz a Rotina nova: o cache atualiza e os lembretes
      // locais seguem (cancela o de hoje e qualquer "adiar" pendente).
      if (json?.items) setCached(ROTINA_CACHE_KEY, json);
      else invalidateCached(ROTINA_CACHE_KEY);
      invalidateCached(HOME_CACHE_KEY);
      return "ok";
    }
    // 400 (não é pra hoje, item apagado) / 401 (saiu da conta): tentar de
    // novo não adianta. 5xx: tenta depois.
    return res.status >= 500 ? "retry" : "drop";
  } catch {
    return "retry"; // sem rede
  }
}

type Pending = { itemId: string; dayKey: string };
const MAX_PENDING = 20;

async function readPending(): Promise<Pending[]> {
  try {
    const raw = await getItemAsync(PENDING_REMINDER_ACTIONS_KEY);
    const list = raw ? (JSON.parse(raw) as Pending[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writePending(list: Pending[]): Promise<void> {
  await setItemAsync(PENDING_REMINDER_ACTIONS_KEY, JSON.stringify(list.slice(-MAX_PENDING))).catch(() => {});
}

async function completeFromNotification(itemId: string): Promise<void> {
  const result = await postComplete(itemId);
  if (result !== "retry") return;
  // Sem internet: guarda e manda quando o app abrir (se ainda for hoje).
  const list = await readPending();
  const dayKey = localDayKey(new Date());
  if (!list.some((p) => p.itemId === itemId && p.dayKey === dayKey)) list.push({ itemId, dayKey });
  await writePending(list);
}

let flushing = false;

/** App abriu/voltou: manda as marcações que ficaram sem internet. */
export async function flushPendingReminderActions(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const list = await readPending();
    if (list.length === 0) return;
    const today = localDayKey(new Date());
    const keep: Pending[] = [];
    for (const pending of list) {
      if (pending.dayKey !== today) continue; // de outro dia: contaria errado
      if ((await postComplete(pending.itemId)) === "retry") keep.push(pending);
    }
    await writePending(keep);
  } finally {
    flushing = false;
  }
}

/** Logout: marcação pendente era da conta que saiu. */
export async function clearPendingReminderActions(): Promise<void> {
  await writePending([]);
}
