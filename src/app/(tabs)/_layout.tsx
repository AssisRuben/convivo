import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { brandHeaderOptions } from "@/components/AppHeader";
import { useProfileDrawer } from "@/lib/profileDrawer";

export default function TabsLayout() {
  const { token } = useAuth();
  const { open: openProfileDrawer } = useProfileDrawer();
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        ...brandHeaderOptions,
        tabBarActiveTintColor: "#e63946",
        tabBarInactiveTintColor: "#0b1e3d99",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: "Catálogo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saude"
        options={{
          title: "Saúde",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rotina"
        options={{
          title: "Rotina",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          // Tocar no ícone de Perfil abre o menu como painel lateral (não
          // navega pra tela cheia) — fica por cima do que já estava na
          // tela, então funciona de qualquer aba.
          tabPress: (e) => {
            e.preventDefault();
            openProfileDrawer();
          },
        }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{
          title: "Carrinho",
          // Só acessível pelo ícone do header — sem botão na barra de baixo.
          href: null,
        }}
      />
    </Tabs>
  );
}
