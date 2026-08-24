import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { showAlert } from "@/lib/alert";

function MenuLink({
  href,
  icon,
  label,
  last,
}: {
  href: Parameters<typeof Link>[0]["href"];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  last?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        className={`flex-row items-center gap-3 p-4 ${last ? "" : "border-b border-navy/5"}`}
      >
        <Ionicons name={icon} size={18} color="#e63946" />
        <Text className="flex-1 text-sm font-medium text-navy">{label}</Text>
        <Ionicons name="chevron-forward" size={16} color="#0b1e3d60" />
      </Pressable>
    </Link>
  );
}

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    showAlert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-24">
      <View className="items-center gap-3 rounded-2xl bg-card p-6 shadow-sm">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-navy/10">
          <Ionicons name="person" size={28} color="#0b1e3d" />
        </View>
        <View className="items-center">
          <Text className="text-lg font-semibold text-navy">{user?.name}</Text>
          <Text className="text-navy/60">{user?.email}</Text>
        </View>
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <MenuLink href="/perfil/meus-dados" icon="person-circle-outline" label="Meus dados" />
        <MenuLink href="/perfil/pedidos" icon="receipt-outline" label="Meus pedidos" />
        <MenuLink
          href="/perfil/historico-compras"
          icon="time-outline"
          label="Histórico de compras"
        />
        <MenuLink href="/perfil/medicamentos" icon="medkit-outline" label="Medicamentos" />
        <MenuLink href="/perfil/minhas-postagens" icon="ribbon-outline" label="Minhas postagens" />
        <MenuLink href="/perfil/fidelidade" icon="medal-outline" label="Cartão fidelidade" />
        <MenuLink href="/perfil/indicacao" icon="gift-outline" label="Indique e ganhe" last />
      </View>

      <Pressable
        onPress={handleLogout}
        className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-coral p-3.5"
      >
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text className="font-semibold text-white">Sair da conta</Text>
      </Pressable>
    </ScrollView>
  );
}
