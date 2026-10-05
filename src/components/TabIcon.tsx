import { View, type ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Ícone da barra de baixo com uma "bolha" colorida por trás quando a aba
 * está ativa, e troca pro ícone preenchido — o outline sozinho (cor
 * uniforme em todas as abas) ficava "clean" demais / sem vida. Cada aba
 * tem sua própria cor de destaque (activeColor), em vez de uma cor global
 * só pra todas.
 */
export function TabIcon({
  name,
  filledName,
  focused,
  color,
  activeColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  filledName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: ColorValue;
  activeColor: string;
}) {
  return (
    <View
      className="items-center justify-center rounded-2xl"
      style={{
        width: 44,
        height: 32,
        backgroundColor: focused ? `${activeColor}1f` : "transparent",
      }}
    >
      <Ionicons name={focused ? filledName : name} size={22} color={focused ? activeColor : (color as string)} />
    </View>
  );
}
