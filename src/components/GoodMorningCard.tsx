import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ApiHomeDashboard } from "@/lib/api";
import { tipOfTheDay } from "@/constants/dailyTips";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Row({
  icon,
  color,
  children,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-center gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22` }}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View className="flex-1">{children}</View>
      {onPress && <Ionicons name="chevron-forward" size={14} color="#ffffff80" />}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

/**
 * "Seu dia" — resumo de abertura da Home: doses, sequência, a leitura
 * liberada hoje, pontos e a dica do dia. Um motivo pra abrir o app toda
 * manhã. Cada linha só aparece quando tem algo a mostrar.
 */
export function GoodMorningCard({
  dashboard,
  dosesTaken,
  dosesTotal,
}: {
  dashboard: ApiHomeDashboard;
  dosesTaken: number;
  dosesTotal: number;
}) {
  const router = useRouter();
  const streak = dashboard.routineStreak ?? 0;
  const points = dashboard.carePoints;
  const missing = points ? Math.max(points.pointsPerReward - points.balance, 0) : 0;

  return (
    <View className="gap-3.5 rounded-3xl bg-navy p-5">
      <Text className="text-xs font-semibold uppercase tracking-wider text-white/60">Seu dia de cuidado</Text>

      {dosesTotal > 0 && (
        <Row icon="medkit" color="#2ec4b6">
          <Text className="text-sm font-semibold text-white">
            {dosesTaken === dosesTotal
              ? "Todas as doses de hoje tomadas 🎉"
              : `${dosesTaken} de ${dosesTotal} doses de hoje tomadas`}
          </Text>
        </Row>
      )}

      <Row icon="flame" color="#f59e0b" onPress={() => router.push("/(tabs)/rotina")}>
        <Text className="text-sm font-semibold text-white">
          {streak > 0
            ? `${streak} dia${streak > 1 ? "s seguidos" : " seguido"} cuidando de você`
            : "Marque um cuidado hoje e comece sua sequência"}
        </Text>
      </Row>

      {dashboard.dailyWisdom && (
        <Row
          icon="bulb"
          color="#fde68a"
          onPress={() =>
            router.push({
              pathname: "/perfil/pilulas-sabedoria/[topico]/capitulo/[numero]",
              params: { topico: dashboard.dailyWisdom!.slug, numero: String(dashboard.dailyWisdom!.chapter) },
            })
          }
        >
          <Text className="text-sm font-semibold text-white">Pílula de hoje liberada</Text>
          <Text className="text-xs text-white/60">
            {dashboard.dailyWisdom.title} · capítulo {dashboard.dailyWisdom.chapter}
          </Text>
        </Row>
      )}

      {dashboard.dailyFaith && (
        <Row
          icon="water"
          color="#7dd3fc"
          onPress={() =>
            router.push({
              pathname: "/perfil/gotas-de-fe/[livro]/capitulo/[numero]",
              params: { livro: dashboard.dailyFaith!.slug, numero: String(dashboard.dailyFaith!.chapter) },
            })
          }
        >
          <Text className="text-sm font-semibold text-white">Gota de fé de hoje liberada</Text>
          <Text className="text-xs text-white/60">
            {dashboard.dailyFaith.title} · capítulo {dashboard.dailyFaith.chapter}
          </Text>
        </Row>
      )}

      {points && (
        <Row icon="sparkles" color="#2ec4b6" onPress={() => router.push("/perfil/fidelidade")}>
          <Text className="text-sm font-semibold text-white">
            {points.todayPoints > 0 ? `+${points.todayPoints} pontos hoje` : "Ganhe pontos cuidando de você"}
          </Text>
          <Text className="text-xs text-white/60">
            {points.monthRewardCents >= points.monthCapCents
              ? `Você já ganhou ${formatPrice(points.monthCapCents)} este mês`
              : `Faltam ${missing} pontos pra ${formatPrice(points.rewardCents)} de crédito`}
          </Text>
        </Row>
      )}

      <View className="rounded-2xl bg-white/10 p-3.5">
        <Text className="text-xs font-semibold text-white/60">Dica do dia</Text>
        <Text className="mt-1 text-sm leading-5 text-white">{tipOfTheDay()}</Text>
      </View>
    </View>
  );
}
