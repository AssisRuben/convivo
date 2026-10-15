import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ApiWeeklyChallenge } from "@/lib/api";
import { showAlert } from "@/lib/alert";

/** Dias até domingo (inclusive hoje), pro "termina em N dias". */
function daysLeftInWeek(): number {
  const weekday = new Date().getDay(); // 0 = domingo
  return weekday === 0 ? 1 : 8 - weekday;
}

// O que conta em cada desafio e pra onde o toque leva (mesmas regras de
// lib/points/challengesCore.ts). "leitura" pergunta qual trilha.
const DETAILS: Record<string, { how: string; to: Href | "leitura" }> = {
  cuidado5: { how: "Conta 1 dia sempre que você marca uma dose ou um cuidado da Rotina.", to: "/(tabs)/rotina" },
  medicao3: { how: "Registre pressão, glicemia ou peso em 3 dias diferentes.", to: "/saude-lancamentos" },
  leitura4: { how: "Cada capítulo de Pílulas de sabedoria ou Gotas de Fé conta 1.", to: "leitura" },
};

/**
 * Desafios da semana (segunda a domingo): progresso de cada um e os
 * pontos de cuidado que vale. Completo = verde com o selo de pontos ganhos.
 * Toque no desafio leva pra onde se cumpre; "Como funciona?" explica.
 */
export function WeeklyChallengesCard({ challenges }: { challenges: ApiWeeklyChallenge[] }) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const done = challenges.filter((c) => c.completed).length;
  const left = daysLeftInWeek();
  const points = challenges[0]?.points ?? 30;

  function go(id: string) {
    const to = DETAILS[id]?.to;
    if (!to) return;
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

  return (
    <View className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="trophy" size={18} color="#f59e0b" />
            <Text className="text-base font-bold text-navy">Desafios da semana</Text>
          </View>
          <Text className="text-xs text-navy/50">
            {done}/{challenges.length} · termina em {left} dia{left > 1 ? "s" : ""}
          </Text>
        </View>
        <Text className="text-xs text-navy/60">
          Cada desafio completo vale +{points} pontos de cuidado, que viram crédito na farmácia.
        </Text>
      </View>

      {challenges.map((c) => {
        const ratio = Math.min(c.progress / c.target, 1);
        return (
          <Pressable
            key={c.id}
            onPress={() => go(c.id)}
            disabled={c.completed}
            accessibilityRole="link"
            className="-mx-2 gap-1.5 rounded-xl px-2 py-1 active:bg-navy/5"
          >
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
              {!c.completed && <Ionicons name="chevron-forward" size={14} color="#0b1e3d50" />}
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
          </Pressable>
        );
      })}

      <Pressable onPress={() => setShowHelp((v) => !v)} className="flex-row items-center gap-1 self-start py-1">
        <Ionicons name="help-circle-outline" size={15} color="#0b1e3d80" />
        <Text className="text-xs font-semibold text-navy/60">{showHelp ? "Fechar" : "Como funciona?"}</Text>
      </Pressable>

      {showHelp && (
        <View className="gap-2 rounded-xl bg-navy/5 p-3">
          <Text className="text-xs text-navy/70">
            • A semana vai de segunda a domingo. Toda segunda os desafios recomeçam do zero.
          </Text>
          {challenges.map((c) =>
            DETAILS[c.id] ? (
              <Text key={c.id} className="text-xs text-navy/70">
                • <Text className="font-semibold">{c.title}:</Text> {DETAILS[c.id].how}
              </Text>
            ) : null
          )}
          <Text className="text-xs text-navy/70">
            • Os pontos entram assim que o desafio fecha. A cada 500 pontos você ganha R$ 5,00 de crédito
            (até R$ 10,00 por mês, com o CPF confirmado no app).
          </Text>
          <Pressable onPress={() => router.push("/perfil/fidelidade")} className="self-start">
            <Text className="text-xs font-semibold text-mint underline">Ver meus pontos</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
