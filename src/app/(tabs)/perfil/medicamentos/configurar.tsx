import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";

const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function ConfigurarMedicamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    nomeProduto: string;
    codigoProduto: string;
    dataEmissao: string;
    quantidade: string;
  }>();

  const [totalUnits, setTotalUnits] = useState(params.quantidade ?? "");
  const [unitsPerDose, setUnitsPerDose] = useState("1");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horarioInput, setHorarioInput] = useState("");
  const [saving, setSaving] = useState(false);

  function addHorario() {
    if (!TIME_FORMAT.test(horarioInput)) {
      showAlert("Horário inválido", "Use o formato HH:mm, ex: 08:00");
      return;
    }
    if (horarios.includes(horarioInput)) {
      setHorarioInput("");
      return;
    }
    setHorarios((prev) => [...prev, horarioInput].sort());
    setHorarioInput("");
  }

  function removeHorario(value: string) {
    setHorarios((prev) => prev.filter((h) => h !== value));
  }

  async function handleSave() {
    const totalUnitsNum = Number(totalUnits);
    const unitsPerDoseNum = Number(unitsPerDose);
    if (!totalUnitsNum || totalUnitsNum <= 0) {
      showAlert("Quantidade inválida", "Informe a quantidade total de comprimidos/unidades");
      return;
    }
    if (!unitsPerDoseNum || unitsPerDoseNum <= 0) {
      showAlert("Posologia inválida", "Informe quantas unidades por dose");
      return;
    }
    if (horarios.length === 0) {
      showAlert("Falta o horário", "Adicione pelo menos um horário de dose");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/mobile/medicamentos", {
        method: "POST",
        body: JSON.stringify({
          productName: params.nomeProduto,
          codigoProduto: params.codigoProduto ? Number(params.codigoProduto) : null,
          purchaseDate: params.dataEmissao,
          totalUnits: totalUnitsNum,
          unitsPerDose: unitsPerDoseNum,
          horarios,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
      router.replace("/perfil/medicamentos");
    } catch (error) {
      showAlert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-3 p-4 pb-24">
      <View className="rounded-2xl bg-card p-4 shadow-sm">
        <Text className="text-xs font-medium uppercase tracking-wide text-navy/50">
          Medicamento
        </Text>
        <Text className="mt-1 text-lg font-semibold text-navy">{params.nomeProduto}</Text>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-navy">Quantidade total (comprimidos/unidades)</Text>
        <TextInput
          value={totalUnits}
          onChangeText={setTotalUnits}
          keyboardType="numeric"
          className="rounded-xl border border-navy/10 bg-card p-3"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-navy">Posologia — unidades por dose</Text>
        <TextInput
          value={unitsPerDose}
          onChangeText={setUnitsPerDose}
          keyboardType="numeric"
          className="rounded-xl border border-navy/10 bg-card p-3"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-navy">Horários das doses</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={horarioInput}
            onChangeText={setHorarioInput}
            placeholder="HH:mm, ex: 08:00"
            className="flex-1 rounded-xl border border-navy/10 bg-card p-3"
          />
          <Pressable onPress={addHorario} className="items-center justify-center rounded-xl bg-navy px-4">
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {horarios.map((h) => (
            <Pressable
              key={h}
              onPress={() => removeHorario(h)}
              className="flex-row items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1.5"
            >
              <Text className="text-sm font-medium text-mint">{h}</Text>
              <Ionicons name="close" size={14} color="#2ec4b6" />
            </Pressable>
          ))}
          {horarios.length === 0 && (
            <Text className="text-xs text-navy/50">Nenhum horário adicionado ainda.</Text>
          )}
        </View>
      </View>

      <Pressable
        disabled={saving}
        onPress={handleSave}
        className="mt-2 items-center rounded-full bg-navy py-3.5 disabled:opacity-50"
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-semibold text-white">Salvar e ativar lembretes</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
