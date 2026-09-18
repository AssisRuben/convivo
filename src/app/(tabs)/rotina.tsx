import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
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
import {
  apiFetch,
  type ApiCareCategory,
  type ApiChecklistItem,
  type RoutineItemInput,
} from "@/lib/api";
import { CARE_CATEGORIES, CARE_CATEGORY_META, WEEKDAY_LABELS } from "@/constants/careCategories";
import { showAlert } from "@/lib/alert";
import { LoadingScreen } from "@/components/LoadingScreen";
import { TimeField } from "@/components/TimeField";
import { ROTINA_CACHE_KEY, fetchRotina } from "@/lib/tabPrefetch";
import { getCached, invalidateCached, loadCached, setCached } from "@/lib/tabDataCache";

function readCachedRotina() {
  return getCached<{ items: ApiChecklistItem[] }>(ROTINA_CACHE_KEY);
}

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
  const [items, setItems] = useState<ApiChecklistItem[]>(
    () => readCachedRotina()?.items ?? []
  );
  const [loading, setLoading] = useState(() => readCachedRotina() === undefined);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedOnce = useRef(false);
  const hadCacheOnMount = useRef(readCachedRotina() !== undefined);
  // "completedToday" é por data — sem isso, um app que fica dias sem ser
  // fechado de vez (só minimizado) continuava mostrando o cache de
  // "concluído hoje" de um dia que já passou, porque loadedOnce nunca
  // deixava buscar de novo depois da primeira vez.
  const lastCheckedDay = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCached(ROTINA_CACHE_KEY, fetchRotina);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const today = new Date().toDateString();
      const dayChanged = lastCheckedDay.current !== null && lastCheckedDay.current !== today;
      lastCheckedDay.current = today;

      if (dayChanged) {
        invalidateCached(ROTINA_CACHE_KEY);
        loadedOnce.current = true;
        load();
        return;
      }

      if (loadedOnce.current) return;
      loadedOnce.current = true;
      if (hadCacheOnMount.current) return; // já veio do cache/prefetch
      load();
    }, [load])
  );

  // Espelha o state atual no cache — cobre a carga inicial e qualquer
  // mutação (completar, salvar, remover) sem precisar sincronizar em
  // cada handler.
  useEffect(() => {
    if (!loading) setCached(ROTINA_CACHE_KEY, { items });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Marca/desmarca na hora, sem esperar o servidor — o banco fica longe
  // (Supabase remota) e travar o clique até a resposta voltar tornava a
  // rotina inteira sensação de "lenta". `latestToggleIntent` guarda a
  // última intenção por item: se o usuário tocar de novo antes da
  // primeira chamada terminar, a resposta antiga (agora desatualizada)
  // não sobrescreve o estado mais novo — só desfaz/confirma quem ainda
  // for a intenção mais recente quando a chamada dela voltar.
  const latestToggleIntent = useRef<Map<string, boolean>>(new Map());

  async function toggleComplete(item: ApiChecklistItem) {
    const nextCompleted = !item.completedToday;
    latestToggleIntent.current.set(item.id, nextCompleted);

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completedToday: nextCompleted } : i))
    );

    try {
      const res = await apiFetch(`/api/mobile/rotina/${item.id}/complete`, {
        method: nextCompleted ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (latestToggleIntent.current.get(item.id) === nextCompleted) {
        setItems(data.items ?? []);
      }
    } catch {
      if (latestToggleIntent.current.get(item.id) === nextCompleted) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, completedToday: !nextCompleted } : i))
        );
        showAlert("Não foi possível salvar", "Sua conexão pode estar instável — tente de novo.");
      }
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
      showAlert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(item: ApiChecklistItem) {
    showAlert("Remover cuidado", `Remover "${item.title}" da sua rotina?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          // Some da tela na hora (mesma razão do toggleComplete: o banco
          // é remoto) e só volta se o servidor recusar.
          const snapshot = items;
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          try {
            const res = await apiFetch(`/api/mobile/rotina/${item.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
          } catch {
            setItems((prev) =>
              prev.some((i) => i.id === item.id)
                ? prev
                : snapshot.filter((i) => i.id === item.id || prev.some((p) => p.id === i.id))
            );
            showAlert("Não foi possível remover", "Sua conexão pode estar instável — tente de novo.");
          }
        },
      },
    ]);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const grouped = CARE_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-24">
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

          <TimeField
            value={form.timeOfDay}
            onChange={(v) => setForm((prev) => (prev ? { ...prev, timeOfDay: v } : prev))}
            placeholder="Horário (opcional)"
            optional
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
                        item.completedToday ? "text-navy/40" : "text-navy"
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
                    accessibilityLabel="Editar rotina"
                    hitSlop={10}
                    className="p-2.5"
                  >
                    <Ionicons name="pencil-outline" size={16} color="#0b1e3d80" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemove(item)}
                    accessibilityLabel="Remover rotina"
                    hitSlop={10}
                    className="p-2.5"
                  >
                    <Ionicons name="trash-outline" size={16} color="#e63946" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
