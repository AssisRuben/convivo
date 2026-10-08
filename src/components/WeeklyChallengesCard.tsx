import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ApiWeeklyChallenge } from "@/lib/api";

/** Dias até domingo (inclusive hoje), pro "termina em N dias". */
function daysLeftInWeek(): number {
  const weekday = new Date().getDay(); // 0 = domingo
  return weekday === 0 ? 1 : 8 - weekday;
}

/**
 * Desafios da semana (segunda a domingo): progresso de cada um e os
 * pontos de cuidado que vale. Completo = verde com o selo de pontos ganhos.
 */
export function WeeklyChallengesCard({ challenges }: { challenges: ApiWeeklyChallenge[] }) {
  const done = challenges.filter((c) => c.completed).length;
  const left = daysLeftInWeek();

  return (
    <View className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="trophy" size={18} color="#f59e0b" />
          <Text className="text-base font-bold text-navy">Desafios da semana</Text>
        </View>
        <Text className="text-xs text-navy/50">
          {done}/{challenges.length} · termina em {left} dia{left > 1 ? "s" : ""}
        </Text>
      </View>

      {challenges.map((c) => {
        const ratio = Math.min(c.progress / c.target, 1);
        return (
          <View key={c.id} className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={c.completed ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={c.completed ? "#2ec4b6" : "#0b1e3d40"}
              />
              <Text className={`flex-1 text-sm ${c.completed ? "font-semibold text-mint" : "text-navy"}`}>
                {c.title}
              </Text>
              <Text className={`text-xs font-bold ${c.completed ? "text-mint" : "text-[#f59e0b]"}`}>
                {c.completed ? `+${c.points} ganhos` : `+${c.points}`}
              </Text>
            </View>
            {!c.completed && (
              <View className="ml-7 flex-row items-center gap-2">
                <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/5">
                  <View className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${Math.round(ratio * 100)}%` }} />
                </View>
                <Text className="text-[11px] text-navy/50">
                  {c.progress}/{c.target}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
