import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  apiFetch,
  type ApiCareCategory,
  type ApiChecklistItem,
  type RoutineItemInput,
} from "@/lib/api";
import { CARE_CATEGORIES, CARE_CATEGORY_META, WEEKDAY_LABELS } from "@/constants/careCategories";

type FormState = {
  id: string | null;
  title: string;
  category: ApiCareCategory;
  timeOfDay: string;
  daysOfWeek: number[];
};

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  category: "OUTRO",
  timeOfDay: "",
  daysOfWeek: [],
};

export default function RotinaScreen() {
  const [items, setItems] = useState<ApiChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/rotina");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      load();
    }, [load])
  );

  async function toggleComplete(item: ApiChecklistItem) {
    setBusyId(item.id);
    try {
      const res = await apiFetch(`/api/mobile/rotina/${item.id}/complete`, {
        method: item.completedToday ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
    } finally {
      setBusyId(null);
    }
  }

  function toggleDay(day: number) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
              ? prev.daysOfWeek.filter((d) => d !== day)
              : [...prev.daysOfWeek, day].sort(),
          }
        : prev
    );
  }

  async function handleSaveForm() {
    if (!form || !form.title.trim()) return;
    setSaving(true);
    try {
      const input: RoutineItemInput = {
        title: form.title.trim(),
        category: form.category,
        timeOfDay: form.timeOfDay || null,
        daysOfWeek: form.daysOfWeek,
      };
      const res = await apiFetch(form.id ? `/api/mobile/rotina/${form.id}` : "/api/mobile/rotina", {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
      setItems(data.items ?? []);
      setForm(null);
    } catch (error) {
      Alert.alert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(item: ApiChecklistItem) {
    Alert.alert("Remover cuidado", `Remover "${item.title}" da sua rotina?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setBusyId(item.id);
          try {
            const res = await apiFetch(`/api/mobile/rotina/${item.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) setItems(data.items ?? []);
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const grouped = CARE_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-10">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-navy">Minha rotina</Text>
        <Pressable
          onPress={() => setForm(EMPTY_FORM)}
          className="flex-row items-center gap-1.5 rounded-full bg-mint/15 px-3 py-2"
        >
          <Ionicons name="add" size={16} color="#2ec4b6" />
          <Text className="text-sm font-medium text-mint">Novo cuidado</Text>
        </Pressable>
      </View>

      {form && (
        <View className="mb-4 gap-3 rounded-2xl bg-card p-4 shadow-sm">
          <TextInput
            autoFocus
            value={form.title}
            onChangeText={(v) => setForm((prev) => (prev ? { ...prev, title: v } : prev))}
            placeholder="Ex: Tomar Losartana, Treino de força..."
            className="rounded-xl border border-navy/10 p-3"
          />

          <View className="flex-row flex-wrap gap-2">
            {CARE_CATEGORIES.map((cat) => {
              const meta = CARE_CATEGORY_META[cat];
              const active = form.category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setForm((prev) => (prev ? { ...prev, category: cat } : prev))}
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
            value={form.timeOfDay}
            onChangeText={(v) => setForm((prev) => (prev ? { ...prev, timeOfDay: v } : prev))}
            placeholder="Horário (opcional), ex: 08:00"
            className="rounded-xl border border-navy/10 p-3"
          />

          <View className="flex-row flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, day) => {
              const active = form.daysOfWeek.includes(day);
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

          <View className="flex-row gap-2">
            <Pressable
              disabled={saving}
              onPress={handleSaveForm}
              className="rounded-xl bg-navy px-4 py-2.5 disabled:opacity-50"
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-white">Salvar</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setForm(null)} className="rounded-xl px-4 py-2.5">
              <Text className="text-sm text-navy/60">Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {items.length === 0 && !form && (
        <Text className="text-sm text-navy/60">
          Nenhum cuidado cadastrado ainda — monte sua rotina de medicação, treino, alimentação e
          mais.
        </Text>
      )}

      {grouped.map(({ category, items: catItems }) => {
        const meta = CARE_CATEGORY_META[category];
        return (
          <View key={category} className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-navy/70">
              {meta.emoji} {meta.label}
            </Text>
            <View className="gap-2">
              {catItems.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 rounded-2xl bg-card p-3 shadow-sm"
                >
                  <Pressable
                    disabled={busyId === item.id}
                    onPress={() => toggleComplete(item)}
                    className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
                      item.completedToday ? "border-mint bg-mint" : "border-navy/20"
                    }`}
                  >
                    {item.completedToday && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </Pressable>

                  <View className="flex-1">
                    <Text
                      className={`text-sm font-medium ${
                        item.completedToday ? "text-navy/40 line-through" : "text-navy"
                      }`}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-xs text-navy/50">
                      {item.timeOfDay ?? "Sem horário fixo"}
                      {" · "}
                      {item.daysOfWeek.length === 0
                        ? "Todo dia"
                        : item.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(", ")}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setForm({
                        id: item.id,
                        title: item.title,
                        category: item.category,
                        timeOfDay: item.timeOfDay ?? "",
                        daysOfWeek: item.daysOfWeek,
                      })
                    }
                    className="p-1.5"
                  >
                    <Ionicons name="pencil-outline" size={16} color="#0b1e3d80" />
                  </Pressable>
                  <Pressable onPress={() => handleRemove(item)} className="p-1.5">
                    <Ionicons name="trash-outline" size={16} color="#e63946" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
