import { useEffect, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { Animated, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useProfileDrawer } from "@/lib/profileDrawer";
import { showAlert } from "@/lib/alert";

const DRAWER_WIDTH = Math.min(260, Dimensions.get("window").width * 0.75);

function MenuLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onNavigate: (href: Href) => void;
}) {
  return (
    <Pressable
      onPress={() => onNavigate(href)}
      className="flex-row items-center gap-3 border-b border-navy/5 px-4 py-3.5"
    >
      <Ionicons name={icon} size={18} color="#0b1e3d" />
      <Text className="flex-1 text-sm font-medium text-navy">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#0b1e3d60" />
    </Pressable>
  );
}

/**
 * Menu de Perfil como painel lateral (desliza da esquerda, sobre o
 * conteúdo atual) em vez de tela cheia — tocar num item navega e já
 * fecha o painel.
 */
export function ProfileDrawer() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isOpen, close } = useProfileDrawer();
  const [translateX] = useState(() => new Animated.Value(-DRAWER_WIDTH));

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOpen, translateX]);

  function navigate(href: Href) {
    close();
    router.push(href);
  }

  function handleLogout() {
    showAlert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => { close(); logout(); } },
    ]);
  }

  return (
    // Container próprio, preso à viewport e com overflow escondido — sem
    // isso, o painel fechado (empurrado pra fora com translateX negativo)
    // ainda contava como área de scroll da página inteira no web (todo
    // parente sem overflow:hidden herdava essa largura extra invisível à
    // esquerda), deixando o app inteiro com scroll horizontal e conteúdo
    // cortado. Isolar aqui garante que nada do que acontece dentro do
    // drawer vaza pro layout do resto do app.
    <View pointerEvents="box-none" style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 40 }}>
      {isOpen && (
        <Pressable
          onPress={close}
          className="absolute inset-0 bg-black/40"
          accessibilityLabel="Fechar menu"
        />
      )}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: DRAWER_WIDTH,
          transform: [{ translateX }],
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          overflow: "hidden",
          backgroundColor: "#ffffff",
          // className (NativeWind) não é confiável em Animated.View — não
          // aplicava (o painel ficava translúcido, conteúdo por trás
          // vazando). Cor de fundo e sombra direto no style garantem que
          // funciona independente disso.
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 12,
        }}
      >
        <ScrollView className="flex-1" contentContainerClassName="pb-8">
          <View className="items-center gap-1.5 border-b border-navy/5 px-4 pb-4 pt-6">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-navy/10">
              <Ionicons name="person" size={20} color="#0b1e3d" />
            </View>
            <View className="items-center">
              <Text className="text-sm font-semibold text-navy">{user?.name}</Text>
              <Text className="text-xs text-navy/50">{user?.email}</Text>
            </View>
          </View>

          <View>
            <MenuLink
              href="/perfil/meus-dados"
              icon="person-circle-outline"
              label="Meus dados"
              onNavigate={navigate}
            />
            <MenuLink
              href="/perfil/pedidos"
              icon="receipt-outline"
              label="Meus pedidos"
              onNavigate={navigate}
            />
            <MenuLink
              href="/perfil/historico-compras"
              icon="time-outline"
              label="Histórico de compras"
              onNavigate={navigate}
            />
            <MenuLink
              href="/perfil/medicamentos"
              icon="medkit-outline"
              label="Medicamentos"
              onNavigate={navigate}
            />
            <MenuLink href="/perfil/metas" icon="flag-outline" label="Minhas metas" onNavigate={navigate} />
            <MenuLink
              href="/perfil/minhas-postagens"
              icon="ribbon-outline"
              label="Minhas postagens"
              onNavigate={navigate}
            />
            <MenuLink
              href="/perfil/fidelidade"
              icon="medal-outline"
              label="Cartão fidelidade"
              onNavigate={navigate}
            />
            <MenuLink
              href="/perfil/indicacao"
              icon="gift-outline"
              label="Indique e ganhe"
              onNavigate={navigate}
            />
          </View>

          <Pressable
            onPress={handleLogout}
            className="mx-4 mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-coral p-3.5"
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text className="font-semibold text-white">Sair da conta</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
