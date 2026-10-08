import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ApiCaregivingSummary } from "@/lib/api";

/**
 * Modo cuidador no Home: como estão hoje as pessoas que eu acompanho
 * (doses tomadas e atrasadas). Toque abre Família e cuidadores.
 */
export function CaregivingCard({ people }: { people: ApiCaregivingSummary[] }) {
  return (
    <Pressable onPress={() => router.push("/perfil/familia")} className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="people" size={18} color="#2ec4b6" />
          <Text className="text-base font-bold text-navy">Quem você acompanha</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#0b1e3d60" />
      </View>
      {people.map((p) => {
        const allDone = p.dosesTotal > 0 && p.dosesTaken === p.dosesTotal;
        return (
          <View key={p.linkId} className="flex-row items-center gap-2">
            <Ionicons
              name={p.overdue > 0 ? "alert-circle" : allDone ? "checkmark-circle" : "time-outline"}
              size={18}
              color={p.overdue > 0 ? "#e63946" : allDone ? "#2ec4b6" : "#0b1e3d60"}
            />
            <Text className="flex-1 text-sm font-medium text-navy">{p.name}</Text>
            <Text className={`text-xs ${p.overdue > 0 ? "font-semibold text-coral" : "text-navy/60"}`}>
              {p.dosesTotal === 0
                ? "sem remédios hoje"
                : p.overdue > 0
                  ? `${p.overdue} atrasado${p.overdue > 1 ? "s" : ""}`
                  : `${p.dosesTaken} de ${p.dosesTotal} tomados`}
            </Text>
          </View>
        );
      })}
    </Pressable>
  );
}
