import { Stack } from "expo-router";
import { BackHeaderButton, brandHeaderOptions } from "@/components/AppHeader";

/** Aba Conversa: o chat do cliente, ou a lista de conversas do gestor →
 * uma conversa. */
export default function ConversaLayout() {
  return (
    <Stack screenOptions={brandHeaderOptions}>
      <Stack.Screen name="index" />
      {/* Só a seta própria: com headerBackVisible a nativa aparecia junto,
          duas setas no cabeçalho (a nativa colada no nome do cliente). */}
      <Stack.Screen name="[threadId]" options={{ headerBackVisible: false, headerLeft: BackHeaderButton }} />
    </Stack>
  );
}
