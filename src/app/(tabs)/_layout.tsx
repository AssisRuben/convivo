import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";

export default function TabsLayout() {
  const { token } = useAuth();
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerTintColor: "#0b1e3d",
        tabBarActiveTintColor: "#e63946",
        tabBarInactiveTintColor: "#0b1e3d99",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Farmácia Conviva Parquelândia",
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
        name="carrinho"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
