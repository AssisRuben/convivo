import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/lib/auth";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading } = useAuth();

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
        options={{ headerShown: true, title: "Produto", headerBackTitle: "Voltar" }}
      />
      <Stack.Screen
        name="saude"
        options={{ headerShown: true, title: "Saúde", headerBackTitle: "Voltar" }}
      />
      <Stack.Screen
        name="pedidos"
        options={{ headerShown: true, title: "Meus pedidos", headerBackTitle: "Voltar" }}
      />
      <Stack.Screen
        name="pedidos/[id]"
        options={{ headerShown: true, title: "Pedido", headerBackTitle: "Voltar" }}
      />
      <Stack.Screen
        name="comunidade"
        options={{ headerShown: true, title: "Comunidade", headerBackTitle: "Voltar" }}
      />
      <Stack.Screen
        name="indicacao"
        options={{ headerShown: true, title: "Indique e Ganhe", headerBackTitle: "Voltar" }}
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
