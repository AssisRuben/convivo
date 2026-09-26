import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  apiFetch,
  type ApiCareCategory,
  type ApiChecklistItem,
  type ApiGoalMetric,
  type GoalInput,
} from "@/lib/api";
import {
  CARE_CATEGORIES,
  CARE_CATEGORY_META,
  WEEKDAY_LABELS,
} from "@/constants/careCategories";
import { showAlert } from "@/lib/alert";
import { TimeField } from "@/components/TimeField";

const METRIC_OPTIONS: { value: ApiGoalMetric; label: string; hint: string }[] =
  [
    { value: "PESO", label: "Peso", hint: "Ex: perder 10kg" },
    { value: "PRESSAO", label: "Pressão", hint: "Ex: reduzir a pressão" },
    { value: "ROTINA", label: "Rotina", hint: "Ex: estudar todo dia" },
  ];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export default function NovaMetaScreen() {
  const router = useRouter();
  // Vindo do "Criar meta com este cuidado" da Rotina — já abre em Rotina
  // com aquele item escolhido.
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const [metric, setMetric] = useState<ApiGoalMetric>(
    itemId ? "ROTINA" : "PESO",
  );
  const [title, setTitle] = useState("");
  // Cuidados da Rotina que ainda não têm meta — dá pra ligar a meta a um
  // deles em vez de criar um item duplicado pro mesmo hábito. null = novo.
  const [availableItems, setAvailableItems] = useState<ApiChecklistItem[]>([]);
  const [linkedItemId, setLinkedItemId] = useState<string | null>(
    itemId ?? null,
  );

  useEffect(() => {
    apiFetch("/api/mobile/rotina")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items: ApiChecklistItem[] }) => {
        const free = (data.items ?? []).filter(
          (i) => i.activeGoals.length === 0,
        );
        setAvailableItems(free);
        const preselected = free.find((i) => i.id === itemId);
        if (preselected) setTitle((prev) => prev || preselected.title);
      })
      .catch(() => {});
  }, [itemId]);
  const [targetValue, setTargetValue] = useState("");
  const [durationDays, setDurationDays] = useState("60");
  const [category, setCategory] = useState<ApiCareCategory>("OUTRO");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  }

  const duration = Math.max(1, parseInt(durationDays, 10) || 0);
  const endDatePreview = toDateOnlyString(addDays(todayUtc(), duration));

  async function handleSave() {
    if (!title.trim()) {
      showAlert("Erro", "Descreva a meta");
      return;
    }
    if (metric === "PESO" && (!targetValue || Number(targetValue) <= 0)) {
      showAlert("Erro", "Informe quantos kg você quer perder");
      return;
    }

    setSaving(true);
    try {
      const input: GoalInput = {
        metric,
        title: title.trim(),
        targetValue: metric === "PESO" ? Number(targetValue) : null,
        startDate: toDateOnlyString(todayUtc()),
        endDate: endDatePreview,
        routine:
          metric === "ROTINA" && !linkedItemId
            ? { category, timeOfDay: timeOfDay || null, daysOfWeek }
            : undefined,
        existingChecklistItemId: metric === "ROTINA" ? linkedItemId : null,
      };
      const res = await apiFetch("/api/mobile/metas", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error ?? "Não foi possível criar a meta");
      router.replace("/perfil/metas");
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
        contentContainerClassName="gap-3 p-4 pb-24"
      >
        <Text className="text-lg font-bold text-navy">Nova meta</Text>

        <View className="flex-row gap-2">
          {METRIC_OPTIONS.map((option) => {
            const active = metric === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setMetric(option.value)}
                className={`flex-1 items-center rounded-xl py-3 ${active ? "bg-navy" : "bg-navy/5"}`}
              >
                <Text
                  className={
                    active ? "font-semibold text-white" : "text-navy/70"
                  }
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-xs text-navy/50">
          {METRIC_OPTIONS.find((o) => o.value === metric)?.hint}
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título da meta"
          className="rounded-xl border border-navy/10 bg-card p-3"
        />

        {metric === "PESO" && (
          <TextInput
            value={targetValue}
            onChangeText={setTargetValue}
            placeholder="Quantos kg você quer perder"
            keyboardType="decimal-pad"
            className="rounded-xl border border-navy/10 bg-card p-3"
          />
        )}

        {metric === "ROTINA" && (
          <View className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
            <Text className="text-sm font-medium text-navy">
              Qual cuidado essa meta acompanha?
            </Text>

            <View className="gap-2">
              <Pressable
                onPress={() => setLinkedItemId(null)}
                className={`rounded-xl border p-3 ${linkedItemId === null ? "border-navy bg-navy/5" : "border-navy/10"}`}
              >
                <Text className="text-sm font-medium text-navy">
                  ➕ Criar um cuidado novo na Rotina
                </Text>
              </Pressable>
              {availableItems.map((item) => {
                const selected = linkedItemId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setLinkedItemId(item.id);
                      if (!title.trim()) setTitle(item.title);
                    }}
                    className={`rounded-xl border p-3 ${selected ? "border-navy bg-navy/5" : "border-navy/10"}`}
                  >
                    <Text className="text-sm font-medium text-navy">
                      {CARE_CATEGORY_META[item.category].emoji} {item.title}
                    </Text>
                    <Text className="text-xs text-navy/50">
                      Já está na sua Rotina · {item.timeOfDay ?? "sem horário"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {linkedItemId === null && (
              <>
                <Text className="mt-1 text-sm font-medium text-navy">
                  Detalhes do novo cuidado
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {CARE_CATEGORIES.map((cat) => {
                    const meta = CARE_CATEGORY_META[cat];
                    const active = category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={`rounded-full px-3 py-1.5 ${active ? "bg-navy" : "bg-navy/5"}`}
                      >
                        <Text
                          className={`text-xs font-medium ${active ? "text-white" : "text-navy/70"}`}
                        >
                          {meta.emoji} {meta.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TimeField
                  value={timeOfDay}
                  onChange={setTimeOfDay}
                  placeholder="Horário (opcional)"
                  optional
                />

                <View className="flex-row flex-wrap gap-1.5">
                  {WEEKDAY_LABELS.map((label, day) => {
                    const active = daysOfWeek.includes(day);
                    return (
                      <Pressable
                        key={day}
                        onPress={() => toggleDay(day)}
                        className={`h-9 w-11 items-center justify-center rounded-lg ${
                          active ? "bg-mint" : "bg-navy/5"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${active ? "text-white" : "text-navy/70"}`}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text className="text-xs text-navy/50">
                  Nenhum dia selecionado = todo dia.
                </Text>
              </>
            )}
          </View>
        )}

        <View className="gap-2 rounded-2xl bg-card p-4 shadow-sm">
          <Text className="text-sm font-medium text-navy">Prazo</Text>
          <TextInput
            value={durationDays}
            onChangeText={setDurationDays}
            placeholder="Duração em dias"
            keyboardType="number-pad"
            className="rounded-xl border border-navy/10 p-3"
          />
          <Text className="text-xs text-navy/50">
            {duration} dia(s) — termina em{" "}
            {endDatePreview.split("-").reverse().join("/")}
          </Text>
        </View>

        <Pressable
          disabled={saving}
          onPress={handleSave}
          className="mt-2 items-center rounded-full bg-navy py-3.5 disabled:opacity-50"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Criar meta</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
