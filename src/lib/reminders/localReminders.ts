import type { ApiChecklistItem } from "@/lib/api";
import { getCached, loadCached, subscribeCached } from "@/lib/tabDataCache";
import { ROTINA_CACHE_KEY, fetchRotina } from "@/lib/tabPrefetch";
import { reportLocalRemindersUntil, setupNotifications } from "@/lib/push/registerPushToken";
import {
  LOCAL_REMINDER_PREFIX,
  localDayKey,
  planReminders,
  type ReminderItem,
} from "@/lib/reminders/localRemindersCore";

/**
 * Lembretes de rotina agendados NO CELULAR (não mais push do servidor):
 * tocam no minuto certo, sem internet, no fuso do aparelho. Seguem a lista
 * da Rotina pelo cache (ROTINA_CACHE_KEY) — qualquer mudança nela (abrir a
 * aba, marcar no Home, editar remédio) reagenda. O servidor continua com
 * o push de reserva pros dias que o aparelho não cobriu (ver
 * coveredByLocalReminders em dispatchCore.ts).
 *
 * Marcou como feito → o de hoje é cancelado (e sai da barra se já tocou).
 * Limitação conhecida: marcado em OUTRO aparelho ou pelo cuidador, este
 * só fica sabendo quando a lista da Rotina for buscada de novo.
 */

type RotinaData = { items: ApiChecklistItem[] };

let last: { items: ReminderItem[]; dayKey: string } | null = null;
let queue: Promise<void> = Promise.resolve();

/** Reagenda pra esta lista (de hoje). Em fila: nunca dois ao mesmo tempo. */
export function syncLocalReminders(items: ReminderItem[], itemsDayKey: string = localDayKey(new Date())): Promise<void> {
  last = { items, dayKey: itemsDayKey };
  queue = queue.then(runSync).catch((error) => console.warn("[lembretes] falha ao agendar:", error));
  return queue;
}

/** Recalcula com a última lista conhecida (ex.: permissão acabou de ser dada). */
export function resyncLocalReminders(): Promise<void> {
  if (!last) return Promise.resolve();
  return syncLocalReminders(last.items, last.dayKey);
}

async function runSync(): Promise<void> {
  const snapshot = last;
  if (!snapshot) return;
  const Notifications = await setupNotifications();
  if (!Notifications) return;

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) {
    // Sem permissão o agendado não aparece: o servidor manda o de reserva
    // (que também não aparece, mas volta a valer se a permissão voltar).
    await reportLocalRemindersUntil(null);
    return;
  }

  const now = new Date();
  const { reminders, coveredUntil } = planReminders(snapshot.items, now, snapshot.dayKey);
  const wanted = new Map(reminders.map((r) => [r.id, r]));

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (!request.identifier.startsWith(LOCAL_REMINDER_PREFIX)) continue;
    const plan = wanted.get(request.identifier);
    // mesmo id = mesmo item, dia e horário; texto diferente = título editado
    if (plan && request.content.body === plan.body) {
      wanted.delete(request.identifier);
      continue;
    }
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }

  for (const plan of wanted.values()) {
    await Notifications.scheduleNotificationAsync({
      identifier: plan.id,
      content: {
        title: plan.title,
        body: plan.body,
        sound: "default",
        data: { screen: "rotina", url: "/rotina", kind: "local-reminder", itemId: plan.itemId, dayKey: plan.dayKey },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: plan.fireAt,
        channelId: "lembretes",
      },
    });
  }

  // Já tocou hoje e a pessoa marcou depois: tira da barra.
  const todayKey = localDayKey(now);
  if (snapshot.dayKey === todayKey) {
    const done = new Set(snapshot.items.filter((i) => i.completedToday).map((i) => i.id));
    if (done.size > 0) {
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const notification of presented) {
        const data = notification.request.content.data as { kind?: unknown; itemId?: unknown; dayKey?: unknown } | undefined;
        if (data?.kind !== "local-reminder" || data.dayKey !== todayKey) continue;
        if (typeof data.itemId === "string" && done.has(data.itemId)) {
          await Notifications.dismissNotificationAsync(notification.request.identifier);
        }
      }
    }
  }

  await reportLocalRemindersUntil(coveredUntil);
}

/** Logout: lembrete da conta que saiu não pode tocar pra próxima. */
export async function clearLocalReminders(): Promise<void> {
  last = null;
  await queue.catch(() => {});
  try {
    const Notifications = await setupNotifications();
    if (!Notifications) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      if (request.identifier.startsWith(LOCAL_REMINDER_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const notification of presented) {
      const data = notification.request.content.data as { kind?: unknown } | undefined;
      if (data?.kind === "local-reminder") await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  } catch (error) {
    console.warn("[lembretes] falha ao limpar:", error);
  }
}

const REFETCH_DELAY_MS = 1500;
let refetchTimer: ReturnType<typeof setTimeout> | undefined;

/** Busca a Rotina (se não estiver no cache) — o listener agenda com ela. */
export function refreshLocalReminders(): void {
  const cached = getCached<RotinaData>(ROTINA_CACHE_KEY);
  if (cached) {
    syncLocalReminders(cached.items ?? []);
    return;
  }
  loadCached(ROTINA_CACHE_KEY, fetchRotina).catch(() => {
    // sem rede: os já agendados continuam valendo; tenta na próxima
  });
}

/**
 * Liga o acompanhamento (uma vez, com o usuário logado). Lista nova no
 * cache → reagenda. Invalidada (editou remédio, por exemplo) → busca de
 * novo daqui a pouco, mesmo que a aba Rotina nunca seja aberta — se a
 * tela buscar antes, o loadCached reaproveita a mesma requisição.
 */
export function startLocalReminders(): () => void {
  const unsubscribe = subscribeCached(ROTINA_CACHE_KEY, (data) => {
    if (data) {
      clearTimeout(refetchTimer);
      syncLocalReminders((data as RotinaData).items ?? []);
      return;
    }
    clearTimeout(refetchTimer);
    refetchTimer = setTimeout(refreshLocalReminders, REFETCH_DELAY_MS);
  });
  refreshLocalReminders();
  return () => {
    clearTimeout(refetchTimer);
    unsubscribe();
  };
}
