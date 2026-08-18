import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export const HEADER_NAVY = "#0b1e3d";
export const HEADER_CORAL = "#e63946";

export function AppHeaderTitle() {
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name="sparkles" size={18} color={HEADER_CORAL} />
      <Text className="text-base font-bold text-white">Farmácia Conviva Parquelândia</Text>
    </View>
  );
}

export function CartHeaderButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/carrinho")}
      className="mr-1 rounded-full p-2"
      hitSlop={8}
      accessibilityLabel="Carrinho"
    >
      <Ionicons name="cart-outline" size={22} color="#fff" />
    </Pressable>
  );
}

/**
 * Mesmo header (fundo navy, estrelinha coral, nome centralizado, carrinho
 * à direita) em todas as telas — a marca fica sempre visível, igual ao
 * header fixo do pagamentoapp.
 */
export const brandHeaderOptions = {
  headerStyle: { backgroundColor: HEADER_NAVY },
  headerTintColor: "#fff",
  headerTitleAlign: "center" as const,
  headerTitle: AppHeaderTitle,
  headerRight: CartHeaderButton,
  // Sem seta de voltar em lugar nenhum — a navegação é pelas abas de
  // baixo (voltar por gesto/botão do sistema continua funcionando).
  headerBackVisible: false,
};
