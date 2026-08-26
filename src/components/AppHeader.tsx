import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/lib/cartState";

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
  const { count } = useCart();

  return (
    <Pressable
      onPress={() => router.push("/carrinho")}
      className="mr-1 rounded-full p-2"
      hitSlop={8}
      accessibilityLabel={count > 0 ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho"}
    >
      <Ionicons name="cart-outline" size={22} color="#fff" />
      {count > 0 && (
        <View
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 3,
            backgroundColor: HEADER_CORAL,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: HEADER_NAVY,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Seta de voltar explícita, pra telas fora das abas (produto/categoria) —
 * `headerLeft: undefined` pra "restaurar o padrão" não funcionou (o
 * native-stack não trata isso como "sem override", continuava sem seta),
 * então renderiza uma de verdade em vez de depender desse comportamento.
 */
export function BackHeaderButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.push("/"))}
      className="ml-1 rounded-full p-2"
      hitSlop={8}
      accessibilityLabel="Voltar"
    >
      <Ionicons name="chevron-back" size={24} color="#fff" />
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
  // headerLeft explícito é mais confiável que headerBackVisible sozinho
  // (no web o back nativo às vezes ainda aparecia). Telas fora das abas
  // (produto/categoria) restauram o padrão explicitamente, por terem
  // saída própria — ver app/_layout.tsx.
  headerBackVisible: false,
  headerLeft: () => null,
};
