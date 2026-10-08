import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";
import { invalidateCached } from "@/lib/tabDataCache";
import { HOME_CACHE_KEY, ROTINA_CACHE_KEY } from "@/lib/tabPrefetch";
import { MedicationForm } from "@/components/MedicationForm";

type FichaMedicamento = {
  id: string;
  productName: string;
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  daysOfWeek?: number[];
  treatmentDays?: number | null;
  startDate?: string;
  /** Quanto deve restar hoje (ausente em servidor antigo). */
  unitsRemaining?: number;
};

/**
 * Editar uma ficha já cadastrada: quantidade, dose, horários e uso
 * contínuo x tratamento de N dias. Os horários são os mesmos itens da
 * Rotina — o servidor cria/desativa itens lá conforme a lista daqui.
 */
export default function EditarMedicamentoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ficha, setFicha] = useState<FichaMedicamento | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/mobile/medicamentos");
        const data = await res.json();
        const encontrada = (data.items ?? []).find((item: FichaMedicamento) => item.id === id);
        if (!encontrada) setErro("Medicamento não encontrado.");
        else setFicha(encontrada);
      } catch {
        setErro("Não foi possível carregar o medicamento.");
      }
    })();
  }, [id]);

  if (erro) {
    return (
      <View className="flex-1 items-center justify-center bg-cream p-6">
        <Text className="text-center text-navy/60">{erro}</Text>
      </View>
    );
  }

  if (!ficha) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <MedicationForm
      productName={ficha.productName}
      // A quantidade no formulário é "quantos você tem agora": parte do que
      // deve restar hoje, não do que tinha na última contagem.
      initial={{ ...ficha, totalUnits: ficha.unitsRemaining ?? ficha.totalUnits }}
      submitLabel="Salvar alterações"
      onSubmit={async (values) => {
        const res = await apiFetch(`/api/mobile/medicamentos/${ficha.id}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
        // Horários/duração mudam a Home e a Rotina — as duas buscam de novo
        // na próxima vez que ganharem foco.
        invalidateCached(HOME_CACHE_KEY);
        invalidateCached(ROTINA_CACHE_KEY);
        router.back();
      }}
    />
  );
}
