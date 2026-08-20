import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { brandHeaderOptions } from "@/components/AppHeader";

export default function TabsLayout() {
  const { token } = useAuth();
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
        listeners={({ navigation }) => ({
          // Tocar no ícone de Perfil sempre volta pro menu — mesmo depois
          // de um push vindo de outra aba (ex: Carrinho → Pedido) ter
          // deixado essa aba "fundo" numa tela aninhada. Sem isso, o reset
          // padrão só acontece tocando duas vezes (aba já em foco).
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("perfil", { screen: "index" });
          },
        })}
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
