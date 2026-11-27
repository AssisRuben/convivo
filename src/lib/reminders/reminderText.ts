/**
 * Texto do lembrete de rotina — o mesmo no push de reserva do servidor
 * (dispatchCore.ts) e no lembrete agendado no próprio celular
 * (localRemindersCore.ts). Sem import de React Native: roda nos dois lados.
 */
export function routineReminderContent(title: string, timeOfDay: string): { title: string; body: string } {
  return { title: "Hora de cuidar de você 💊", body: `${title} — ${timeOfDay}` };
}

/**
 * Canais Android (o usuário silencia cada um nas configurações do
 * celular). A importância de um canal não muda depois de criado — trocar
 * importância = id novo. Criados no app (lib/push/notificationChannels.ts);
 * o servidor só manda `channelId` pra quem diz ter "channels-v1".
 */
export type PushChannel = "lembretes" | "cuidador" | "chat" | "conta" | "novidades";
