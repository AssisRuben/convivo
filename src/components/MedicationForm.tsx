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
  /** "Comecei a tomar em", "YYYY-MM-DD". */
  startDate: string;
  /** Comprimidos/unidades que a pessoa tem AGORA. */
  totalUnits: number;
  unitsPerDose: number;
  horarios: string[];
  /** Dias da semana (0 = domingo); vazio = todo dia. */
  daysOfWeek: number[];
  /** null = uso contínuo. */
  treatmentDays: number | null;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const START_DAYS_SHOWN = 14;

function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

/** Hoje e os 13 dias anteriores, do mais recente pro mais antigo. */
function recentDays(): { iso: string; label: string; sub: string }[] {
  return Array.from({ length: START_DAYS_SHOWN }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return {
      iso: toIsoDay(date),
      label: i === 0 ? "Hoje" : i === 1 ? "Ontem" : WEEKDAYS[date.getDay()],
      sub: day + "/" + month,
    };
  });
}

function formatBrDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d + "/" + m + "/" + y;
}

/**
 * Campos da ficha de medicamento — usado no cadastro (novo.tsx,
 * configurar.tsx) e na edição ([id]/editar.tsx). Valida antes de chamar
 * `onSubmit`; quem chama só cuida da requisição.
 *
 * Estoque e tratamento são perguntas separadas: "quantos você tem agora"
 * (a previsão de quando acaba conta de hoje) e "quando começou a tomar"
 * (só pro "Dia 5 de 7" e pro fim dos lembretes).
 */
export function MedicationForm({
  productName,
  initial,
  unitsHint,
  submitLabel,
  onSubmit,
}: {
  productName: string;
  initial: {
    totalUnits?: number | null;
    unitsPerDose?: number;
    horarios?: string[];
    daysOfWeek?: number[];
    treatmentDays?: number | null;
    startDate?: string | null;
  };
  /** Texto de apoio embaixo da quantidade (ex.: de onde veio a sugestão). */
  unitsHint?: string;
  submitLabel: string;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
}) {
  const days = recentDays();
  const hoje = days[0].iso;
  const [startDate, setStartDate] = useState(initial.startDate ?? hoje);
  // Data mais antiga que a fileira (ficha antiga sendo editada): aparece
  // como uma opção a mais no começo, pra não se perder ao salvar.
  const olderStart =
    initial.startDate && !days.some((d) => d.iso === initial.startDate)
      ? initial.startDate
      : null;
  const [totalUnits, setTotalUnits] = useState(
    initial.totalUnits ? String(initial.totalUnits) : "",
  );
  const [unitsPerDose, setUnitsPerDose] = useState(
    String(initial.unitsPerDose ?? 1),
  );
  const [horarios, setHorarios] = useState<string[]>(initial.horarios ?? []);
  // Todo dia (padrão) ou só em alguns dias da semana (ex.: Ozempic toda
  // quinta) — o estoque e a adesão contam só os dias marcados.
  const [todoDia, setTodoDia] = useState(!initial.daysOfWeek?.length);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initial.daysOfWeek ?? []);
  // Uso contínuo = sem data pra acabar (Home mostra a soma do mês);
  // tratamento = N dias a partir do início (Home mostra "Dia 5 de 7").
  const [usoContinuo, setUsoContinuo] = useState(initial.treatmentDays == null);
  const [treatmentDays, setTreatmentDays] = useState(
    initial.treatmentDays ? String(initial.treatmentDays) : "",
  );
  const [saving, setSaving] = useState(false);

  function addHorario(value: string) {
    if (!value) return;
    setHorarios((prev) =>
      prev.includes(value) ? prev : [...prev, value].sort(),
    );
  }

  function removeHorario(value: string) {
    setHorarios((prev) => prev.filter((h) => h !== value));
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  async function handleSave() {
    const totalUnitsNum = Number(totalUnits);
    const unitsPerDoseNum = Number(unitsPerDose);
    if (!Number.isInteger(totalUnitsNum) || totalUnitsNum <= 0) {
      showAlert(
        "Quantidade inválida",
        "Informe quantos comprimidos (ou unidades) você tem agora",
      );
      return;
    }
    if (!Number.isInteger(unitsPerDoseNum) || unitsPerDoseNum <= 0) {
      showAlert(
        "Dose inválida",
        "Informe quantos comprimidos você toma de cada vez",
      );
      return;
    }
    if (horarios.length === 0) {
      showAlert(
        "Falta o horário",
        "Adicione pelo menos um horário em que você toma",
      );
      return;
    }
    if (!todoDia && daysOfWeek.length === 0) {
      showAlert(
        "Faltam os dias",
        "Marque em quais dias da semana você toma (ex.: Qui)",
      );
      return;
    }
    const treatmentDaysNum = Number(treatmentDays);
    if (
      !usoContinuo &&
      (!Number.isInteger(treatmentDaysNum) || treatmentDaysNum <= 0)
    ) {
      showAlert(
        "Duração inválida",
        "Informe por quantos dias deve tomar (ex.: 7)",
      );
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        startDate,
        totalUnits: totalUnitsNum,
        unitsPerDose: unitsPerDoseNum,
        horarios,
        daysOfWeek: todoDia ? [] : daysOfWeek,
        treatmentDays: usoContinuo ? null : treatmentDaysNum,
      });
    } catch (error) {
      showAlert(
        "Erro ao salvar",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-cream"
        contentContainerClassName="gap-4 p-4 pb-24"
      >
        <View className="rounded-2xl bg-card p-4 shadow-sm">
          <Text className="text-xs font-medium uppercase tracking-wide text-navy/50">
            Medicamento
          </Text>
          <Text className="mt-1 text-lg font-semibold text-navy">
            {productName}
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-navy">
            Quantos comprimidos (ou unidades) você tem agora?
          </Text>
          <TextInput
            value={totalUnits}
            onChangeText={setTotalUnits}
            keyboardType="number-pad"
            placeholder="Ex.: 30"
            className="rounded-xl border border-navy/10 bg-card p-3"
          />
          <Text className="text-xs text-navy/50">
            {unitsHint ??
              "Conte o que tem em mãos — o app avisa antes de acabar."}
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-medium text-navy">
            Quantos você toma de cada vez?
          </Text>
          <TextInput
            value={unitsPerDose}
            onChangeText={setUnitsPerDose}
            keyboardType="number-pad"
            className="rounded-xl border border-navy/10 bg-card p-3"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-navy">
            Em quais horários você toma?
          </Text>
          <TimeField
            value=""
            onChange={addHorario}
            placeholder="Adicionar horário"
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
              <Text className="text-xs text-navy/50">
                Nenhum horário adicionado ainda.
              </Text>
            )}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-navy">
            Em quais dias?
          </Text>
          <View className="flex-row gap-2">
            {[
              { value: true, label: "Todo dia" },
              { value: false, label: "Em dias específicos" },
            ].map((opcao) => {
              const ativo = todoDia === opcao.value;
              return (
                <Pressable
                  key={opcao.label}
                  onPress={() => setTodoDia(opcao.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  className={`flex-1 items-center rounded-full border py-2.5 ${
                    ativo ? "border-navy bg-navy" : "border-navy/15 bg-card"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${ativo ? "text-white" : "text-navy"}`}
                  >
                    {opcao.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!todoDia && (
            <View className="gap-1">
              <View className="flex-row justify-between">
                {WEEKDAYS.map((label, day) => {
                  const ativo = daysOfWeek.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => toggleDay(day)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: ativo }}
                      className={`h-11 w-11 items-center justify-center rounded-full ${
                        ativo ? "bg-mint" : "border border-navy/15 bg-card"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${ativo ? "text-white" : "text-navy/70"}`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-xs text-navy/50">
                Ex.: injeção uma vez por semana. O lembrete e a conta de quando
                acaba valem só para os dias marcados.
              </Text>
            </View>
          )}
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-navy">
            Quando começou a tomar?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {olderStart && (
              <DayChip
                label="Início"
                sub={formatBrDate(olderStart).slice(0, 5)}
                active={startDate === olderStart}
                onPress={() => setStartDate(olderStart)}
              />
            )}
            {days.map((d) => (
              <DayChip
                key={d.iso}
                label={d.label}
                sub={d.sub}
                active={startDate === d.iso}
                onPress={() => setStartDate(d.iso)}
              />
            ))}
          </ScrollView>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-navy">
            Por quanto tempo vai tomar?
          </Text>
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
                  <Text
                    className={`text-sm font-medium ${ativo ? "text-white" : "text-navy"}`}
                  >
                    {opcao.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {usoContinuo ? (
            <Text className="text-xs text-navy/50">
              Sem data para acabar — a tela inicial mostra quantas doses você
              tomou no mês.
            </Text>
          ) : (
            <View className="gap-1">
              <TextInput
                value={treatmentDays}
                onChangeText={setTreatmentDays}
                keyboardType="number-pad"
                placeholder="Quantos dias? (ex.: 7)"
                className="rounded-xl border border-navy/10 bg-card p-3"
              />
              <Text className="text-xs text-navy/50">
                Contando a partir do dia em que começou a tomar. A tela inicial
                mostra “Dia 5 de 7” e os lembretes param sozinhos no fim do
                tratamento.
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

function DayChip({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      className={`items-center rounded-2xl border px-3.5 py-2 ${
        active ? "border-navy bg-navy" : "border-navy/15 bg-card"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${active ? "text-white" : "text-navy"}`}
      >
        {label}
      </Text>
      <Text
        className={`text-[11px] ${active ? "text-white/70" : "text-navy/50"}`}
      >
        {sub}
      </Text>
    </Pressable>
  );
}
