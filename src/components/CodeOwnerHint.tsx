import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CodeOwnerState } from "@/lib/useCodeOwner";

/** Linha embaixo do campo de código: de quem é, ou que não existe. */
export function CodeOwnerHint({ state }: { state: CodeOwnerState }) {
  if (state.status === "idle") return null;
  if (state.status === "checking") {
    return (
      <View className="flex-row items-center gap-1.5">
        <ActivityIndicator size="small" color="#0b1e3d80" />
        <Text className="text-xs text-navy/50">Conferindo o código…</Text>
      </View>
    );
  }
  if (state.status === "notfound") {
    return (
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="alert-circle" size={15} color="#e63946" />
        <Text className="text-xs text-coral">Código não encontrado. Confira as letras e números.</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name="checkmark-circle" size={15} color="#2ec4b6" />
      <Text className="text-xs text-navy">
        Código de <Text className="font-semibold">{state.name}</Text>
        {state.kind === "vendedor" ? " (vendedor da farmácia)" : ""}
      </Text>
    </View>
  );
}
