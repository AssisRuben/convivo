import { useEffect } from "react";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/lib/auth";
import { brandHeaderOptions } from "@/components/AppHeader";
import { useProfileDrawer } from "@/lib/profileDrawer";
import { prefetchAllTabs } from "@/lib/tabPrefetch";
import { TabIcon } from "@/components/TabIcon";

// Uma cor de destaque por aba, em vez da mesma cor pra todas — cada ícone
// ganha sua "bolha" nessa cor quando ativo (ver TabIcon.tsx).
const TAB_COLORS = {
  home: "#e63946",
  produtos: "#f59e0b",
  saude: "#3b82f6",
  rotina: "#2ec4b6",
  perfil: "#8b5cf6",
};

export default function TabsLayout() {
  const { token } = useAuth();
  const { open: openProfileDrawer } = useProfileDrawer();

  // Dispara a busca das 4 abas em paralelo assim que o usuário loga, em
  // vez de cada uma só buscar quando ganha foco pela primeira vez — troca
  // de aba fica instantânea depois disso (ver tabPrefetch.ts). Roda uma
  // vez por sessão de token (login/restauração), não a cada re-render.
  useEffect(() => {
    if (token) prefetchAllTabs();
  }, [token]);

  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        ...brandHeaderOptions,
        tabBarInactiveTintColor: "#0b1e3d99",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarActiveTintColor: TAB_COLORS.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" filledName="home" focused={focused} color={color} activeColor={TAB_COLORS.home} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: "Produtos",
          tabBarActiveTintColor: TAB_COLORS.produtos,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="bag-handle-outline"
              filledName="bag-handle"
              focused={focused}
              color={color}
              activeColor={TAB_COLORS.produtos}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saude"
        options={{
          title: "Saúde",
          tabBarActiveTintColor: TAB_COLORS.saude,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart-outline" filledName="heart" focused={focused} color={color} activeColor={TAB_COLORS.saude} />
          ),
        }}
      />
      <Tabs.Screen
        name="rotina"
        options={{
          title: "Rotina",
          tabBarActiveTintColor: TAB_COLORS.rotina,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="checkmark-done-circle-outline"
              filledName="checkmark-done-circle"
              focused={focused}
              color={color}
              activeColor={TAB_COLORS.rotina}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Menu",
          headerShown: false,
          tabBarActiveTintColor: TAB_COLORS.perfil,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="menu-outline" filledName="menu" focused={focused} color={color} activeColor={TAB_COLORS.perfil} />
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
