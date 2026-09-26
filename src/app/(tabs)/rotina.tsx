import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
  type ApiRoutineItemDetail,
  type RoutineItemInput,
} from "@/lib/api";
import { CARE_CATEGORIES, CARE_CATEGORY_META, WEEKDAY_LABELS } from "@/constants/careCategories";
import { showAlert } from "@/lib/alert";
import { LoadingScreen } from "@/components/LoadingScreen";
import { TimeField } from "@/components/TimeField";
import { CelebrationModal } from "@/components/CelebrationModal";
import { RotinaCompleteToast } from "@/components/RotinaCompleteToast";
import { ROTINA_CACHE_KEY, fetchRotina } from "@/lib/tabPrefetch";
import { getCached, invalidateCached, loadCached, setCached } from "@/lib/tabDataCache";

function readCachedRotina() {
  return getCached<{ items: ApiChecklistItem[]; streakDays: number }>(ROTINA_CACHE_KEY);
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

/** "há 2h30", "amanhã", "em 3 dias" — pra caber no modal de detalhe sem números soltos. */
function formatMinutesUntil(daysAhead: number, minutesUntil: number): string {
  if (daysAhead === 0 && minutesUntil < 0) {
    const overdue = -minutesUntil;
    const h = Math.floor(overdue / 60);
    const m = overdue % 60;
    return `Atrasado hoje há ${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : h > 0 ? "" : "menos de 1min"}`;
  }
  if (daysAhead === 0) {
    const h = Math.floor(minutesUntil / 60);
    const m = minutesUntil % 60;
    if (h === 0 && m === 0) return "Agora";
    return `Em ${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : ""}`;
  }
  if (daysAhead === 1) return "Amanhã";
  return `Em ${daysAhead} dias`;
}

export default function RotinaScreen() {
  const [items, setItems] = useState<ApiChecklistItem[]>(
    () => readCachedRotina()?.items ?? []
  );
  const [streakDays, setStreakDays] = useState(() => readCachedRotina()?.streakDays ?? 0);
  const [loading, setLoading] = useState(() => readCachedRotina() === undefined);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailItem, setDetailItem] = useState<ApiChecklistItem | null>(null);
  const [detail, setDetail] = useState<ApiRoutineItemDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [celebration, setCelebration] = useState<number | null>(null);
  const [completeToast, setCompleteToast] = useState<string | null>(null);
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
      setStreakDays(data.streakDays ?? 0);
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
    if (!loading) setCached(ROTINA_CACHE_KEY, { items, streakDays });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, streakDays]);

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
    // Nenhum outro cuidado feito hoje ainda — essa marcação é a primeira
    // do dia, vale comemorar (só quando está marcando, não desmarcando).
    const isFirstOfDay = nextCompleted && items.every((i) => i.id === item.id || !i.completedToday);
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
        setStreakDays(data.streakDays ?? 0);
        if (nextCompleted) {
          // A primeira do dia ganha a comemoração grande (streak, com
          // confete); as seguintes só o toast leve — senão marcar várias
          // atividades seguidas vira uma sequência cansativa de telas.
          if (isFirstOfDay) setCelebration(data.streakDays ?? 0);
          else setCompleteToast(item.title);
        }
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

  async function openDetail(item: ApiChecklistItem) {
    setDetailItem(item);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await apiFetch(`/api/mobile/rotina/${item.id}/detalhes`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setDetailLoading(false);
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

  // Duas listas em vez de uma só agrupada por categoria: o que falta fazer
  // fica em cima ("Bora fazer o certo?"), o que já foi feito hoje desce
  // pra baixo ("Aí tu deu aula!") assim que marcado — o movimento entre
  // as duas é o próprio feedback de progresso do dia.
  const pendingItems = items.filter((item) => !item.completedToday);
  const doneItems = items.filter((item) => item.completedToday);

  function renderItemRow(item: ApiChecklistItem) {
    const meta = CARE_CATEGORY_META[item.category];
    return (
      <View key={item.id} className="flex-row items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
        <Pressable
          onPress={() => toggleComplete(item)}
          className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
            item.completedToday ? "border-mint bg-mint" : "border-navy/20"
          }`}
        >
          {item.completedToday && <Ionicons name="checkmark" size={16} color="#fff" />}
        </Pressable>

        <Pressable className="flex-1" onPress={() => openDetail(item)}>
          <Text
            className={`text-sm font-medium ${item.completedToday ? "text-navy/40" : "text-navy"}`}
          >
            {meta.emoji} {item.title}
          </Text>
          <Text className="text-xs text-navy/50">
            {item.timeOfDay ?? "Sem horário fixo"}
            {" · "}
            {item.daysOfWeek.length === 0
              ? "Todo dia"
              : item.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(", ")}
          </Text>
        </Pressable>

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
        <Pressable onPress={() => handleRemove(item)} accessibilityLabel="Remover rotina" hitSlop={10} className="p-2.5">
          <Ionicons name="trash-outline" size={16} color="#e63946" />
        </Pressable>
      </View>
    );
  }

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

      {streakDays > 0 && (
        <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-navy p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Ionicons name="flame" size={22} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">
              {streakDays} dia{streakDays > 1 ? "s seguidos" : " seguido"} cuidando de você
            </Text>
            <Text className="mt-0.5 text-xs text-white/60">Marque pelo menos um cuidado hoje pra manter</Text>
          </View>
        </View>
      )}

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

      {items.length > 0 && (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-bold text-navy">Bora fazer o certo? 💪</Text>
          {pendingItems.length === 0 ? (
            <View className="items-center rounded-2xl bg-card p-5">
              <Text className="text-sm font-medium text-navy/60">Tudo em dia por aqui! 🎉</Text>
            </View>
          ) : (
            <View className="gap-2">{pendingItems.map(renderItemRow)}</View>
          )}
        </View>
      )}

      {doneItems.length > 0 && (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-bold text-navy">Aí tu deu aula! 🎉</Text>
          <View className="gap-2">{doneItems.map(renderItemRow)}</View>
        </View>
      )}
      </ScrollView>

      <Modal
        visible={detailItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailItem(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 p-6"
          onPress={() => setDetailItem(null)}
        >
          <Pressable className="w-full max-w-sm gap-4 rounded-2xl bg-cream p-5" onPress={() => {}}>
            {detailLoading || !detail || !detailItem ? (
              <View className="items-center py-6">
                <ActivityIndicator color="#0b1e3d" />
              </View>
            ) : (
              <>
                <Text className="text-lg font-bold text-navy">{detailItem.title}</Text>

                <View className="flex-row items-center gap-3 rounded-2xl bg-card p-4">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-coral/10">
                    <Ionicons name="flame" size={20} color="#e63946" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-navy">
                      {detail.streakDays > 0
                        ? `${detail.streakDays} dia${detail.streakDays > 1 ? "s" : ""} seguidos`
                        : "Nenhuma sequência ainda"}
                    </Text>
                    <Text className="text-xs text-navy/50">
                      {detail.streakDays > 0
                        ? "Continue marcando pra não perder o ritmo"
                        : "Marque hoje pra começar sua sequência"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 rounded-2xl bg-card p-4">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-mint/15">
                    <Ionicons name="time" size={20} color="#2ec4b6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-navy">
                      {detail.next
                        ? formatMinutesUntil(detail.next.daysAhead, detail.next.minutesUntil)
                        : detail.completedToday
                          ? "Já feito hoje"
                          : "Sem horário fixo"}
                    </Text>
                    <Text className="text-xs text-navy/50">
                      {detail.timeOfDay ? `Horário: ${detail.timeOfDay}` : "Marque quando lembrar"}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setDetailItem(null)}
                  className="items-center rounded-full bg-navy py-3"
                >
                  <Text className="text-sm font-semibold text-white">Fechar</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <CelebrationModal
        visible={celebration !== null}
        icon="flame"
        color="#f59e0b"
        title="Primeiro cuidado do dia!"
        message="Você já garantiu mais um dia na sua sequência."
        streakDays={celebration ?? undefined}
        streakEmoji="🔥"
        streakLabel="cuidando de você"
        onContinue={() => setCelebration(null)}
      />

      <RotinaCompleteToast
        visible={completeToast !== null}
        title={completeToast ?? ""}
        onDone={() => setCompleteToast(null)}
      />
    </KeyboardAvoidingView>
  );
}
