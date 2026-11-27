import "../global.css";
import { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { resolvePushUrl } from "@/lib/push/pushRoutes";
import { ACTION_DONE, handleReminderAction } from "@/lib/reminders/reminderActions";
import * as SplashScreen from "expo-splash-screen";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AuthProvider, useAuth } from "@/lib/auth";
import { brandHeaderOptions, BackHeaderButton } from "@/components/AppHeader";
import { ProfileDrawerProvider } from "@/lib/profileDrawer";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { OnboardingTour } from "@/components/OnboardingTour";
import { CartProvider } from "@/lib/cartState";
import { initMonitoring, Sentry } from "@/lib/monitoring";
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";

// LinearGradient é de fora do React Native — sem registrar no NativeWind,
// `className` nele era ignorado em silêncio (cantos arredondados, tamanho,
// padding e alinhamento sumiam: era o que deixava o selo do Cartão
// Fidelidade pela metade e o cartão com canto reto).
cssInterop(LinearGradient, { className: "style" });

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

// Notificações já tratadas — a mesma pode chegar pelo listener e pelo
// getLastNotificationResponseAsync na abertura do app.
const handledNotificationIds = new Set<string>();

// Toque numa notificação (lembrete de rotina, aviso de remédio acabando)
// leva direto pra tela relevante (`data.url`, ver lib/push/pushRoutes.ts)
// — só em dispositivo real, Expo push não existe no preview web usado pra
// testar este projeto. `expo-notifications` é importado dinamicamente
// (não no topo do arquivo) porque o próprio import já registra coisa
// sozinho, e desde o SDK 53 isso derruba o Expo Go no Android (removido
// de lá, só funciona em development build) — achado batendo o app real:
// crashava na inicialização antes mesmo de chegar no `if (Platform.OS ===
// "web")`.
//
// Só liga com o login carregado e a navegação montada (`ready`): com o app
// fechado, o toque que abriu o app chega antes disso e só é recuperado
// pelo getLastNotificationResponseAsync — antes ele se perdia e o app
// abria na Home.
function useNotificationTapNavigation(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    if (Platform.OS === "web") return;
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    import("expo-notifications").then(async (Notifications) => {
      if (cancelled) return;
      const open = (response: import("expo-notifications").NotificationResponse) => {
        // Botão do lembrete ("Já tomei", "Daqui 15 min"). No Android quem
        // trata é a tarefa em segundo plano (isso aqui só repete, sem
        // efeito); no iOS o botão abre o app e é aqui que marca — depois
        // mostra a Rotina, pra pessoa ver que ficou marcado.
        if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
          handleReminderAction(response)
            .then((wasReminder) => {
              if (wasReminder && Platform.OS === "ios" && response.actionIdentifier === ACTION_DONE) {
                router.push("/rotina");
              }
            })
            .catch((error) => console.warn("[lembretes] ação da notificação falhou:", error));
          return;
        }
        const id = response.notification.request.identifier;
        if (handledNotificationIds.has(id)) return;
        handledNotificationIds.add(id);
        const url = resolvePushUrl(response.notification.request.content.data);
        if (url) router.push(url as Href);
      };
      subscription = Notifications.addNotificationResponseReceivedListener(open);
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (!cancelled && last) {
          open(last);
          await Notifications.clearLastNotificationResponseAsync();
        }
      } catch {
        // sem resposta guardada / módulo indisponível: nada a abrir
      }
    });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [ready]);
}

function RootNavigator() {
  const { isLoading, token } = useAuth();
  useNotificationTapNavigation(!isLoading && Boolean(token));

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <KeyboardProvider>
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
        <Stack.Screen
          name="ofertas"
          options={{
            ...brandHeaderOptions,
            headerShown: true,
            headerBackVisible: true,
            headerLeft: BackHeaderButton,
          }}
        />
        {/* Botão "Lançamentos" da aba Saúde (registrar + histórico) */}
        <Stack.Screen
          name="saude-lancamentos"
          options={{
            ...brandHeaderOptions,
            headerShown: true,
            headerBackVisible: true,
            headerLeft: BackHeaderButton,
          }}
        />
      </Stack>
      <ProfileDrawer />
      <OnboardingTour />
    </KeyboardProvider>
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
