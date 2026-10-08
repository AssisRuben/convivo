import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { carePetStage } from "@/constants/carePetStages";
import { PetAnimation } from "@/components/PetAnimation";

/** Humor do bichinho hoje: feliz se já houve cuidado, saudade à noite. */
function moodText(doneToday: number, totalToday: number): string {
  if (doneToday > 0 && totalToday > 0 && doneToday >= totalToday) return "Radiante! Tudo feito hoje 💕";
  if (doneToday > 0) return "Feliz! Você já cuidou de você hoje 💕";
  return new Date().getHours() >= 18
    ? "Está com saudade… marque um cuidado hoje 🥺"
    : "Esperando seu primeiro cuidado do dia";
}

/**
 * O bichinho do Home: cresce com a sequência de dias cuidando de si (filhote
 * → troféu → coroa → medalhas) e muda de humor conforme o dia. Toque leva
 * pra Rotina — onde se faz o cuidado que alimenta ele.
 */
export function HomePetCard({
  streakDays,
  doneToday,
  totalToday,
}: {
  streakDays: number;
  doneToday: number;
  totalToday: number;
}) {
  const router = useRouter();
  const { tier, next } = carePetStage(streakDays);

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/rotina")}
      className="flex-row items-center gap-2 overflow-hidden rounded-2xl bg-[#f59e0b]/10 py-2 pr-4"
    >
      <View style={{ width: 130, alignItems: "center" }}>
        <PetAnimation tier={tier} size={64} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-[#b45309]">
          Seu bichinho · {tier.badge} {tier.label}
        </Text>
        <Text className="text-sm font-semibold text-navy">{moodText(doneToday, totalToday)}</Text>
        <Text className="text-xs text-navy/60">
          {next
            ? `Mais ${next.daysLeft} dia${next.daysLeft > 1 ? "s" : ""} seguido${next.daysLeft > 1 ? "s" : ""} e ele vira ${next.label}`
            : "Fase máxima — continue cuidando de você!"}
        </Text>
      </View>
    </Pressable>
  );
}
