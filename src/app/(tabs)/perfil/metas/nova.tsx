import { useState } from "react";
import { useRouter } from "expo-router";
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
  type ApiGoalMetric,
  type GoalInput,
} from "@/lib/api";
import { CARE_CATEGORIES, CARE_CATEGORY_META, WEEKDAY_LABELS } from "@/constants/careCategories";
import { showAlert } from "@/lib/alert";

const METRIC_OPTIONS: { value: ApiGoalMetric; label: string; hint: string }[] = [
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
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default function NovaMetaScreen() {
  const router = useRouter();
  const [metric, setMetric] = useState<ApiGoalMetric>("PESO");
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [durationDays, setDurationDays] = useState("60");
  const [category, setCategory] = useState<ApiCareCategory>("OUTRO");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
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
        routine: metric === "ROTINA" ? { category, timeOfDay: timeOfDay || null, daysOfWeek } : undefined,
      };
      const res = await apiFetch("/api/mobile/metas", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível criar a meta");
      router.replace("/perfil/metas");
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
              <Text className={active ? "font-semibold text-white" : "text-navy/70"}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="text-xs text-navy/50">{METRIC_OPTIONS.find((o) => o.value === metric)?.hint}</Text>

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
          <Text className="text-sm font-medium text-navy">Detalhes da rotina</Text>

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
                  <Text className={`text-xs font-medium ${active ? "text-white" : "text-navy/70"}`}>
                    {meta.emoji} {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={timeOfDay}
            onChangeText={setTimeOfDay}
            placeholder="Horário (opcional), ex: 19:00"
            className="rounded-xl border border-navy/10 p-3"
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
                  <Text className={`text-xs font-medium ${active ? "text-white" : "text-navy/70"}`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-xs text-navy/50">Nenhum dia selecionado = todo dia.</Text>
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
          {duration} dia(s) — termina em {endDatePreview.split("-").reverse().join("/")}
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
