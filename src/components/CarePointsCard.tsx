import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ApiCarePointsSummary } from "@/lib/api";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const WAYS: { icon: keyof typeof Ionicons.glyphMap; label: string; points: string }[] = [
  { icon: "medkit-outline", label: "Tomar a dose do remédio", points: "+2" },
  { icon: "checkmark-done-outline", label: "Marcar um cuidado da Rotina", points: "+1" },
  { icon: "pulse-outline", label: "Registrar uma medição (1x por dia)", points: "+5" },
  { icon: "book-outline", label: "Ler a pílula ou a gota do dia", points: "+3" },
  { icon: "trophy-outline", label: "Completar um desafio da semana", points: "+30" },
];

/**
 * Pontos de cuidado: saldo rumo ao próximo crédito, quanto do teto do mês
 * já foi ganho e como ganhar. `compact` mostra só a barra (Home).
 */
export function CarePointsCard({ summary, compact = false }: { summary: ApiCarePointsSummary; compact?: boolean }) {
  const progress = Math.min(summary.balance / summary.pointsPerReward, 1);
  const missing = Math.max(summary.pointsPerReward - summary.balance, 0);
  const capReached = summary.monthRewardCents >= summary.monthCapCents;

  return (
    <View className="gap-3 rounded-2xl bg-card p-5 shadow-sm">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-mint/15">
          <Ionicons name="sparkles" size={20} color="#2ec4b6" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-navy">Pontos de cuidado</Text>
          <Text className="text-xs text-navy/60">
            {summary.balance} de {summary.pointsPerReward} pontos
            {summary.todayPoints > 0 ? ` · +${summary.todayPoints} hoje` : ""}
          </Text>
        </View>
      </View>

      <View className="h-2.5 overflow-hidden rounded-full bg-navy/5">
        <View className="h-full rounded-full bg-mint" style={{ width: `${Math.round(progress * 100)}%` }} />
      </View>

      <Text className="text-xs text-navy/60">
        {capReached
          ? `Você já ganhou ${formatPrice(summary.monthCapCents)} este mês — os pontos continuam guardados pro mês que vem.`
          : missing === 0
            ? `Crédito de ${formatPrice(summary.rewardCents)} a caminho da sua carteira!`
            : `Faltam ${missing} pontos pra ganhar ${formatPrice(summary.rewardCents)} de crédito.`}
      </Text>

      {!compact && (
        <>
          <Text className="text-xs text-navy/50">
            Este mês: {formatPrice(summary.monthRewardCents)} de {formatPrice(summary.monthCapCents)} ganhos com
            pontos.
          </Text>
          <View className="gap-2 border-t border-navy/5 pt-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-navy/50">Como ganhar</Text>
            {WAYS.map((way) => (
              <View key={way.label} className="flex-row items-center gap-2.5">
                <Ionicons name={way.icon} size={16} color="#0b1e3d99" />
                <Text className="flex-1 text-sm text-navy/80">{way.label}</Text>
                <Text className="text-sm font-bold text-mint">{way.points}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
