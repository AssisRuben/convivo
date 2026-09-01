import "../global.css";
import { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { AuthProvider, useAuth } from "@/lib/auth";
import { brandHeaderOptions, BackHeaderButton } from "@/components/AppHeader";
import { ProfileDrawerProvider } from "@/lib/profileDrawer";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { CartProvider } from "@/lib/cartState";
import { initMonitoring, Sentry } from "@/lib/monitoring";

SplashScreen.preventAutoHideAsync();

// O mais cedo possível — antes de qualquer outro código do app rodar,
// pra pegar erro de inicialização também, não só o que acontece depois
// que a árvore já montou.
initMonitoring();

function CrashFallback({ resetError }: { resetError: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-cream p-6">
      <Text className="text-center text-lg font-semibold text-navy">Algo deu errado</Text>
      <Text className="text-center text-sm text-navy/60">
        Já registramos o problema. Tente de novo — se continuar, feche e abra o app.
      </Text>
      <Pressable onPress={resetError} className="mt-2 rounded-full bg-navy px-5 py-2.5">
        <Text className="text-sm font-semibold text-white">Tentar de novo</Text>
      </Pressable>
    </View>
  );
}

// Toque numa notificação (lembrete de rotina, aviso de remédio acabando)
// leva direto pra tela relevante — só em dispositivo real, Expo push não
// existe no preview web usado pra testar este projeto. `expo-notifications`
// é importado dinamicamente (não no topo do arquivo) porque o próprio
// import já registra coisa sozinho, e desde o SDK 53 isso derruba o Expo
// Go no Android (removido de lá, só funciona em development build) —
// achado batendo o app real: crashava na inicialização antes mesmo de
// chegar no `if (Platform.OS === "web")`.
function useNotificationTapNavigation() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

    let subscription: { remove: () => void } | undefined;
    import("expo-notifications").then((Notifications) => {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const screen = response.notification.request.content.data?.screen;
        if (screen === "medicamentos") router.push("/perfil/medicamentos");
        else if (screen === "rotina") router.push("/rotina");
        else if (screen === "metas") router.push("/perfil/metas");
      });
    });
    return () => subscription?.remove();
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

function RootLayout() {
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

export default function RootLayoutWithCrashReporting() {
  return (
    <Sentry.ErrorBoundary fallback={CrashFallback}>
      <RootLayout />
    </Sentry.ErrorBoundary>
  );
}
