import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function AuthLayout() {
  const { token } = useAuth();
  if (token) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
