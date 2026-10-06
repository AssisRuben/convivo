import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { showAlert } from "@/lib/alert";
import { TimeField } from "@/components/TimeField";

export type MedicationFormValues = {
  /** Só no cadastro manual (nome digitado); nos outros vem de fora. */
  productName?: string;
  /** "Comecei a tomar em", "YYYY-MM-DD". */
  startDate: string;
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  /** null = uso contínuo. */
  treatmentDays: number | null;
};

function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return toIsoDay(date);
}

/** "06/10/2026" -> "2026-10-06" (null se inválida). */
function parseBrDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getDate() !== Number(d) || date.getMonth() !== Number(m) - 1) return null;
  return toIsoDay(date);
}

function formatBrDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d + "/" + m + "/" + y;
}

/**
 * Campos da ficha de medicamento — usado no cadastro (configurar.tsx) e na
 * edição ([id]/editar.tsx). Valida antes de chamar `onSubmit`; quem chama
 * só cuida da requisição.
 */
export function MedicationForm({
  productName,
  editableName = false,
  initial,
  submitLabel,
  onSubmit,
}: {
  productName: string;
  /** Cadastro manual: a pessoa digita o nome do remédio. */
  editableName?: boolean;
  initial: {
    totalUnits?: number | null;
    unitsPerDose?: number;
    horarios?: string[];
    treatmentDays?: number | null;
    startDate?: string | null;
  };
  submitLabel: string;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
}) {
  const [name, setName] = useState(productName);
  // Data de início: atalhos pra hoje/ontem; outra data é digitada.
  const hoje = daysAgo(0);
  const ontem = daysAgo(1);
  const inicial = initial.startDate ?? hoje;
  const [startChoice, setStartChoice] = useState<"hoje" | "ontem" | "outra">(
    inicial === hoje ? "hoje" : inicial === ontem ? "ontem" : "outra"
  );
  const [otherStart, setOtherStart] = useState(
    inicial === hoje || inicial === ontem ? "" : formatBrDate(inicial)
  );
  const [totalUnits, setTotalUnits] = useState(initial.totalUnits ? String(initial.totalUnits) : "");
  const [unitsPerDose, setUnitsPerDose] = useState(String(initial.unitsPerDose ?? 1));
  const [horarios, setHorarios] = useState<string[]>(initial.horarios ?? []);
  // Uso contínuo = sem data pra acabar (Home mostra a soma do mês);
  // tratamento = N dias a partir da compra (Home mostra "Dia 5 de 7").
  const [usoContinuo, setUsoContinuo] = useState(initial.treatmentDays == null);
  const [treatmentDays, setTreatmentDays] = useState(
    initial.treatmentDays ? String(initial.treatmentDays) : ""
  );
  const [saving, setSaving] = useState(false);

  function addHorario(value: string) {
    if (!value) return;
    setHorarios((prev) => (prev.includes(value) ? prev : [...prev, value].sort()));
  }

  function removeHorario(value: string) {
    setHorarios((prev) => prev.filter((h) => h !== value));
  }

  async function handleSave() {
    if (editableName && !name.trim()) {
      showAlert("Falta o nome", "Digite o nome do remédio (ex.: Losartana 50mg)");
      return;
    }
    const startDate =
      startChoice === "hoje" ? hoje : startChoice === "ontem" ? ontem : parseBrDate(otherStart);
    if (!startDate) {
      showAlert(
        "Data inválida",
        "Digite a data em que começou a tomar no formato dia/mês/ano (ex.: 01/10/2026)"
      );
      return;
    }
    if (startDate > hoje) {
      showAlert("Data inválida", "A data em que começou a tomar não pode ser no futuro");
      return;
    }
    const totalUnitsNum = Number(totalUnits);
    const unitsPerDoseNum = Number(unitsPerDose);
    if (!totalUnitsNum || totalUnitsNum <= 0) {
      showAlert("Quantidade inválida", "Informe quantos comprimidos (ou unidades) você tem");
      return;
    }
    if (!unitsPerDoseNum || unitsPerDoseNum <= 0) {
      showAlert("Dose inválida", "Informe quantos comprimidos você toma de cada vez");
      return;
    }
    if (horarios.length === 0) {
      showAlert("Falta o horário", "Adicione pelo menos um horário de dose");
      return;
    }
    const treatmentDaysNum = Number(treatmentDays);
    if (!usoContinuo && (!Number.isInteger(treatmentDaysNum) || treatmentDaysNum <= 0)) {
      showAlert("Duração inválida", "Informe por quantos dias deve tomar (ex.: 7)");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...(editableName ? { productName: name.trim() } : {}),
        startDate,
        totalUnits: totalUnitsNum,
        unitsPerDose: unitsPerDoseNum,
        horarios,
        treatmentDays: usoContinuo ? null : treatmentDaysNum,
      });
    } catch (error) {
      showAlert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-3 p-4 pb-24">
        {editableName ? (
          <View className="gap-1">
            <Text className="text-sm font-medium text-navy">Nome do remédio</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Losartana 50mg"
              autoCapitalize="words"
              className="rounded-xl border border-navy/10 bg-card p-3"
            />
          </View>
        ) : (
          <View className="rounded-2xl bg-card p-4 shadow-sm">
            <Text className="text-xs font-medium uppercase tracking-wide text-navy/50">
              Medicamento
            </Text>
            <Text className="mt-1 text-lg font-semibold text-navy">{productName}</Text>
          </View>
        )}

        <View className="gap-2">
          <Text className="text-sm font-medium text-navy">Quando começou a tomar?</Text>
          <View className="flex-row gap-2">
            {(
              [
                { value: "hoje", label: "Hoje" },
                { value: "ontem", label: "Ontem" },
                { value: "outra", label: "Outro dia" },
              ] as const
            ).map((opcao) => {
              const ativo = startChoice === opcao.value;
              return (
                <Pressable
                  key={opcao.value}
                  onPress={() => setStartChoice(opcao.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  className={
                    "flex-1 items-center rounded-full border py-2.5 " +
                    (ativo ? "border-navy bg-navy" : "border-navy/15 bg-card")
                  }
                >
                  <Text className={"text-sm font-medium " + (ativo ? "text-white" : "text-navy")}>
                    {opcao.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {startChoice === "outra" && (
            <TextInput
              value={otherStart}
              onChangeText={setOtherStart}
              placeholder="dia/mês/ano (ex.: 01/10/2026)"
              keyboardType="numbers-and-punctuation"
              className="rounded-xl border border-navy/10 bg-card p-3"
            />
          )}
          <Text className="text-xs text-navy/50">
            É daqui que o app conta quando o remédio acaba — não da data da compra.
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-navy">Quantos comprimidos (ou unidades) você tem?</Text>
          <TextInput
            value={totalUnits}
            onChangeText={setTotalUnits}
            keyboardType="numeric"
            className="rounded-xl border border-navy/10 bg-card p-3"
          />
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-navy">Quantos você toma de cada vez?</Text>
          <TextInput
            value={unitsPerDose}
            onChangeText={setUnitsPerDose}
            keyboardType="numeric"
            className="rounded-xl border border-navy/10 bg-card p-3"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-navy">Em quais horários você toma?</Text>
          <TimeField
            value=""
            onChange={addHorario}
            placeholder="Adicionar horário da dose"
            className="bg-card"
          />
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

        <View className="gap-2">
          <Text className="text-sm font-medium text-navy">Por quanto tempo vai tomar?</Text>
          <View className="flex-row gap-2">
            {[
              { value: true, label: "Uso contínuo" },
              { value: false, label: "Por alguns dias" },
            ].map((opcao) => {
              const ativo = usoContinuo === opcao.value;
              return (
                <Pressable
                  key={opcao.label}
                  onPress={() => setUsoContinuo(opcao.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  className={`flex-1 items-center rounded-full border py-2.5 ${
                    ativo ? "border-navy bg-navy" : "border-navy/15 bg-card"
                  }`}
                >
                  <Text className={`text-sm font-medium ${ativo ? "text-white" : "text-navy"}`}>
                    {opcao.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {usoContinuo ? (
            <Text className="text-xs text-navy/50">
              Sem data para acabar — a tela inicial mostra quantas doses você tomou no mês.
            </Text>
          ) : (
            <View className="gap-1">
              <TextInput
                value={treatmentDays}
                onChangeText={setTreatmentDays}
                keyboardType="numeric"
                placeholder="Quantos dias? (ex.: 7)"
                className="rounded-xl border border-navy/10 bg-card p-3"
              />
              <Text className="text-xs text-navy/50">
                Contando a partir do dia em que começou a tomar. A tela inicial mostra “Dia 5
                de 7” e os lembretes param sozinhos no fim do tratamento.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          disabled={saving}
          onPress={handleSave}
          className="mt-2 items-center rounded-full bg-navy py-3.5 disabled:opacity-50"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">{submitLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
