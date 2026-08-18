import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/lib/auth";
import { brandHeaderOptions } from "@/components/AppHeader";

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
        options={{ ...brandHeaderOptions, headerShown: true }}
      />
      <Stack.Screen name="carrinho" options={{ ...brandHeaderOptions, headerShown: true }} />
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
