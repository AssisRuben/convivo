import { Stack } from "expo-router";
import { BackHeaderButton, brandHeaderOptions } from "@/components/AppHeader";

/** Aba Conversa: o chat do cliente, ou a lista de conversas do gestor →
 * uma conversa. */
export default function ConversaLayout() {
  return (
    <Stack screenOptions={brandHeaderOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[threadId]" options={{ headerBackVisible: true, headerLeft: BackHeaderButton }} />
    </Stack>
  );
}
