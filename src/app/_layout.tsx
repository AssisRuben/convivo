import "../global.css";
import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/lib/auth";
import { brandHeaderOptions, BackHeaderButton } from "@/components/AppHeader";
import { ProfileDrawerProvider } from "@/lib/profileDrawer";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { CartProvider } from "@/lib/cartState";

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
      else if (screen === "metas") router.push("/perfil/metas");
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
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="produto/[codigo]"
          options={{
            ...brandHeaderOptions,
            headerShown: true,
            // Empilhada por cima do app inteiro, fora das abas — a barra de
            // baixo não aparece aqui, então sem seta de voltar o usuário
            // fica sem nenhuma saída visível (diferente do resto do app,
            // onde tocar na aba de novo sempre volta pro topo daquela aba).
            headerBackVisible: true,
            headerLeft: BackHeaderButton,
          }}
        />
        <Stack.Screen
          name="categoria/[slug]"
          options={{
            ...brandHeaderOptions,
            headerShown: true,
            headerBackVisible: true,
            headerLeft: BackHeaderButton,
          }}
        />
      </Stack>
      <ProfileDrawer />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <ProfileDrawerProvider>
          <RootNavigator />
        </ProfileDrawerProvider>
      </CartProvider>
    </AuthProvider>
  );
}
