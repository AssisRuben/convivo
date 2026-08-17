import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";

export default function PerfilScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <View className="flex-1 bg-cream p-4">
      <View className="items-center gap-3 rounded-2xl bg-card p-6 shadow-sm">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-navy/10">
          <Ionicons name="person" size={28} color="#0b1e3d" />
        </View>
        <View className="items-center">
          <Text className="text-lg font-semibold text-navy">{user?.name}</Text>
          <Text className="text-navy/60">{user?.email}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleLogout}
        className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-coral p-3.5"
      >
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text className="font-semibold text-white">Sair da conta</Text>
      </Pressable>
    </View>
  );
}
