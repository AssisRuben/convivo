import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ApiCarePointsSummary } from "@/lib/api";
import { showAlert } from "@/lib/alert";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Cada linha leva pra onde se faz a ação (ou se cadastra o que falta:
// remédio, cuidado). "leitura" pergunta qual trilha.
const WAYS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  points: string;
  to: Href | "leitura";
}[] = [
  { icon: "medkit-outline", label: "Tomar a dose do remédio", hint: "Cadastre seus remédios e marque as doses", points: "+2", to: "/perfil/medicamentos" },
  { icon: "checkmark-done-outline", label: "Marcar um cuidado da Rotina", hint: "Monte sua rotina de cuidados", points: "+1", to: "/(tabs)/rotina" },
  { icon: "pulse-outline", label: "Registrar uma medição (até 3 dias por semana)", hint: "Pressão, glicemia, peso", points: "+5", to: "/saude-lancamentos" },
  { icon: "book-outline", label: "Ler um capítulo de Pílulas ou Gotas (1 por dia)", hint: "Uma leitura curta por dia", points: "+3", to: "leitura" },
  { icon: "trophy-outline", label: "Completar um desafio da semana", hint: "Veja os desafios no início", points: "+30", to: "/(tabs)" },
];

/**
 * Pontos de cuidado: saldo rumo ao próximo crédito, quanto do teto do mês
 * já foi ganho e como ganhar. `compact` mostra só a barra (Home).
 */
export function CarePointsCard({ summary, compact = false }: { summary: ApiCarePointsSummary; compact?: boolean }) {
  const router = useRouter();

  function go(to: Href | "leitura") {
    if (to !== "leitura") {
      router.push(to);
      return;
    }
    showAlert("Ler um capítulo", "Qual trilha você quer ler hoje?", [
      { text: "Pílulas de sabedoria", onPress: () => router.push("/perfil/pilulas-sabedoria") },
      { text: "Gotas de Fé", onPress: () => router.push("/perfil/gotas-de-fe") },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

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

      {summary.canRedeem === false && (
        <Pressable
          onPress={() => router.push("/perfil/meus-dados")}
          className="flex-row items-start gap-2 rounded-xl bg-amber-50 p-3"
        >
          <Ionicons name="id-card-outline" size={16} color="#92400e" />
          <Text className="flex-1 text-xs text-amber-800">
            Confirme seu CPF em Menu › Meus dados para seus pontos virarem crédito. Até lá, eles ficam
            guardados. <Text className="font-semibold underline">Confirmar agora</Text>
          </Text>
        </Pressable>
      )}

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
              <Pressable
                key={way.label}
                onPress={() => go(way.to)}
                accessibilityRole="link"
                className="-mx-2 flex-row items-center gap-2.5 rounded-xl px-2 py-1.5 active:bg-navy/5"
              >
                <Ionicons name={way.icon} size={16} color="#0b1e3d99" />
                <View className="flex-1">
                  <Text className="text-sm text-navy/80">{way.label}</Text>
                  <Text className="text-[11px] text-navy/45">{way.hint}</Text>
                </View>
                <Text className="text-sm font-bold text-mint">{way.points}</Text>
                <Ionicons name="chevron-forward" size={14} color="#0b1e3d50" />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
