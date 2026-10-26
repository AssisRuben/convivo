import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/** "2h15", "45min", "menos de 1min". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0 && m === 0) return "menos de 1min";
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Minutos de agora até "HH:MM" de hoje (negativo = já passou). */
export function minutesUntilTime(timeOfDay: string, now: Date): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeOfDay.trim());
  if (!match) return null;
  const target = Number(match[1]) * 60 + Number(match[2]);
  return target - (now.getHours() * 60 + now.getMinutes());
}

export type NextCare = { title: string; timeOfDay: string; minutesUntil: number };

export function RotinaProgressCard({
  done,
  total,
  streakDays,
  next,
  untimedPending,
  now,
}: {
  done: number;
  total: number;
  streakDays: number;
  next: NextCare | null;
  untimedPending: number;
  now: Date;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;
  const todayCounts = done > 0;
  const minutesToMidnight = 24 * 60 - (now.getHours() * 60 + now.getMinutes());

  let streakTitle: string;
  let streakHint: string;
  if (streakDays > 0) {
    streakTitle = `${streakDays} dia${streakDays > 1 ? "s seguidos" : " seguido"}`;
    streakHint = todayCounts
      ? "Hoje já conta ✓"
      : `Faltam ${formatDuration(minutesToMidnight)} pra garantir hoje`;
  } else {
    streakTitle = "Sem sequência ainda";
    streakHint = todayCounts ? "Começou hoje ✓" : "Marque 1 cuidado pra começar";
  }

  let nextTitle: string;
  let nextHint: string;
  let nextColor = "#ffffff";
  if (total === 0) {
    nextTitle = "Nada pra hoje";
    nextHint = "Dia livre na rotina";
  } else if (allDone) {
    nextTitle = "Tudo feito 🎉";
    nextHint = "Até amanhã!";
  } else if (next && next.minutesUntil < 0) {
    nextTitle = `Atrasado há ${formatDuration(-next.minutesUntil)}`;
    nextHint = `${next.title} · ${next.timeOfDay}`;
    nextColor = "#fca5a5";
  } else if (next) {
    nextTitle = `Próximo em ${formatDuration(next.minutesUntil)}`;
    nextHint = `${next.title} · ${next.timeOfDay}`;
  } else {
    nextTitle = `Falta${untimedPending > 1 ? "m" : ""} ${untimedPending}`;
    nextHint = `cuidado${untimedPending > 1 ? "s" : ""} sem horário fixo`;
  }

  return (
    <View className="mb-4 gap-4 rounded-2xl bg-navy p-4">
      <View className="gap-2">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-white/50">Hoje</Text>
            <Text className="text-lg font-bold text-white">
              {total === 0 ? "Nenhum cuidado programado" : `${done} de ${total} cuidados`}
            </Text>
          </View>
          {total > 0 && (
            <Text className="text-2xl font-extrabold" style={{ color: allDone ? "#2ec4b6" : "#ffffff" }}>
              {percent}%
            </Text>
          )}
        </View>
        {total > 0 && (
          <View className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <View className="h-full rounded-full bg-mint" style={{ width: `${percent}%` }} />
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 flex-row items-center gap-2.5 rounded-xl bg-white/5 p-3">
          <Ionicons name="flame" size={22} color={streakDays > 0 ? "#f59e0b" : "#ffffff40"} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-white">{streakTitle}</Text>
            <Text className="text-[11px]" style={{ color: todayCounts ? "#2ec4b6" : "#fde68a" }}>
              {streakHint}
            </Text>
          </View>
        </View>
        <View className="flex-1 flex-row items-center gap-2.5 rounded-xl bg-white/5 p-3">
          <Ionicons name={allDone ? "checkmark-circle" : "alarm-outline"} size={22} color={allDone ? "#2ec4b6" : "#7dd3fc"} />
          <View className="flex-1">
            <Text className="text-sm font-bold" style={{ color: nextColor }}>
              {nextTitle}
            </Text>
            <Text className="text-[11px] text-white/60" numberOfLines={1}>
              {nextHint}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
