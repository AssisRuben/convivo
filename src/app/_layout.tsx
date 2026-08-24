import "../global.css";
import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/lib/auth";
import { brandHeaderOptions } from "@/components/AppHeader";

SplashScreen.preventAutoHideAsync();

// Toque numa notificação (lembrete de rotina, aviso de remédio acabando)
// leva direto pra tela relevante — só em dispositivo real, Expo push não
// existe no preview web usado pra testar este projeto.
function useNotificationTapNavigation() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === "medicamentos") router.push("/perfil/medicamentos");
      else if (screen === "rotina") router.push("/rotina");
    });
    return () => subscription.remove();
  }, []);
}

function RootNavigator() {
  const { isLoading } = useAuth();
  useNotificationTapNavigation();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="produto/[id]"
        options={{ ...brandHeaderOptions, headerShown: true }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
