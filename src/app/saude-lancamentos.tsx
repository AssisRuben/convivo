import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { apiFetch, type ApiHealthMeasurement, type ApiHealthMeasurementType } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SAUDE_CACHE_KEY, fetchSaude } from "@/lib/tabPrefetch";
import { getCached, loadCached, setCached } from "@/lib/tabDataCache";

function readCachedSaude() {
  return getCached<{ measurements: ApiHealthMeasurement[] }>(SAUDE_CACHE_KEY);
}

const TYPE_LABELS: Record<ApiHealthMeasurementType, string> = {
  PRESSAO: "Pressão",
  PESO: "Peso",
  GORDURA: "% Gordura",
  GLICEMIA: "Glicemia",
};

const LOCAL_OPTIONS = ["Farmácia", "Casa", "Outros"];

function formatMeasurement(m: ApiHealthMeasurement): string {
  if (m.type === "PRESSAO") return `${m.pressaoSistolica ?? "?"}/${m.pressaoDiastolica ?? "?"} mmHg`;
  if (m.type === "PESO") return `${m.pesoKg ?? "?"} kg`;
  if (m.type === "GORDURA") return `${m.percentualGordura ?? "?"}%`;
  return `${m.glicemiaMgDl ?? "?"} mg/dL`;
}

type DayGroup = { dateKey: string; dateLabel: string; measurements: ApiHealthMeasurement[] };

function groupByDay(items: ApiHealthMeasurement[]): DayGroup[] {
  const map = new Map<string, ApiHealthMeasurement[]>();
  for (const m of items) {
    const key = new Date(m.measuredAt).toLocaleDateString("pt-BR");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([dateKey, measurements]) => ({
    dateKey,
    dateLabel: dateKey,
    measurements,
  }));
}

/** Card de um dia no histórico — fechado por padrão, só lista as
 * medições daquele dia quando tocado. Evita renderizar toda medição de
 * todo dia de uma vez (o que a FlashList sozinha não resolveria, já que
 * o item é o dia, não a medição individual). */
function DayGroupCard({
  group,
  expanded,
  onToggle,
  onDeleteMeasurement,
}: {
  group: DayGroup;
  expanded: boolean;
  onToggle: () => void;
  onDeleteMeasurement: (id: string) => void;
}) {
  const count = group.measurements.length;
  return (
    <View className="mb-2 rounded-2xl bg-card p-3 shadow-sm">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between"
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Fechar" : "Abrir"} medições de ${group.dateLabel}`}
      >
        <Text className="text-sm font-semibold text-navy">{group.dateLabel}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-navy/40">
            {count} {count === 1 ? "medição" : "medições"}
          </Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#0b1e3d80" />
        </View>
      </Pressable>

      {expanded && (
        <View className="mt-2 gap-1 border-t border-navy/5 pt-2">
          {group.measurements.map((m) => (
            <View key={m.id} className="flex-row items-center gap-2 py-1">
              <Text className="flex-1 text-sm text-navy/70">
                {TYPE_LABELS[m.type]}: {formatMeasurement(m)}{" "}
                <Text className="text-xs text-navy/40">· {m.local}</Text>
              </Text>
              <Pressable
                onPress={() => onDeleteMeasurement(m.id)}
                accessibilityLabel="Remover medição"
                hitSlop={12}
                className="p-2.5"
              >
                <Ionicons name="trash-outline" size={15} color="#e63946" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Lançamentos de saúde (novo registro + histórico por dia) — saiu da aba
 * Saúde, que agora mostra só os gráficos. Lê e grava o mesmo cache da aba
 * (SAUDE_CACHE_KEY): ao voltar, os gráficos já refletem o que foi lançado.
 */
export default function SaudeLancamentosScreen() {
  const [measurements, setMeasurements] = useState<ApiHealthMeasurement[]>(
    () => readCachedSaude()?.measurements ?? []
  );
  const [loading, setLoading] = useState(() => readCachedSaude() === undefined);
  const [saving, setSaving] = useState(false);
  const loadedOnce = useRef(false);
  const hadCacheOnMount = useRef(readCachedSaude() !== undefined);

  const [pesoKg, setPesoKg] = useState("");
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [gordura, setGordura] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [local, setLocal] = useState(LOCAL_OPTIONS[0]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set());

  function toggleDay(dateKey: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCached(SAUDE_CACHE_KEY, fetchSaude);
      setMeasurements(data.measurements ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      if (hadCacheOnMount.current) return; // já veio do cache/prefetch
      load();
    }, [load])
  );

  // Espelha o state atual no cache — a aba Saúde lê daqui pra desenhar os
  // gráficos quando o usuário volta.
  useEffect(() => {
    if (!loading) setCached(SAUDE_CACHE_KEY, { measurements });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurements]);

  async function handleAdd() {
    const measuredAt = new Date().toISOString();
    const entries: Record<string, unknown>[] = [];

    if (pesoKg) entries.push({ type: "PESO", pesoKg: Number(pesoKg), local, measuredAt });
    if (sistolica && diastolica) {
      entries.push({
        type: "PRESSAO",
        pressaoSistolica: Number(sistolica),
        pressaoDiastolica: Number(diastolica),
        local,
        measuredAt,
      });
    }
    if (gordura) {
      entries.push({ type: "GORDURA", percentualGordura: Number(gordura), local, measuredAt });
    }
    if (glicemia) {
      entries.push({ type: "GLICEMIA", glicemiaMgDl: Number(glicemia), local, measuredAt });
    }

    if (entries.length === 0) {
      showAlert("Nada pra registrar", "Preencha ao menos uma medida.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/mobile/saude", {
        method: "POST",
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
      setMeasurements(data.measurements ?? []);
      setPesoKg("");
      setSistolica("");
      setDiastolica("");
      setGordura("");
      setGlicemia("");
    } catch (error) {
      showAlert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await apiFetch(`/api/mobile/saude/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) setMeasurements(data.measurements ?? []);
  }

  function confirmDelete(id: string) {
    showAlert("Remover registro", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => handleDelete(id) },
    ]);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const days = groupByDay(measurements);

  const header = (
    <View>
      <Text className="mb-2 text-sm font-semibold text-navy">Novo registro</Text>
      <View className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
        <View className="flex-row gap-2">
          <TextInput
            value={sistolica}
            onChangeText={setSistolica}
            placeholder="Sistólica"
            keyboardType="numeric"
            className="flex-1 rounded-xl border border-navy/10 p-3"
          />
          <TextInput
            value={diastolica}
            onChangeText={setDiastolica}
            placeholder="Diastólica"
            keyboardType="numeric"
            className="flex-1 rounded-xl border border-navy/10 p-3"
          />
        </View>
        <TextInput
          value={pesoKg}
          onChangeText={setPesoKg}
          placeholder="Peso (kg)"
          keyboardType="numeric"
          className="rounded-xl border border-navy/10 p-3"
        />
        <TextInput
          value={gordura}
          onChangeText={setGordura}
          placeholder="% de gordura corporal"
          keyboardType="numeric"
          className="rounded-xl border border-navy/10 p-3"
        />
        <TextInput
          value={glicemia}
          onChangeText={setGlicemia}
          placeholder="Glicemia (mg/dL)"
          keyboardType="numeric"
          className="rounded-xl border border-navy/10 p-3"
        />

        <Text className="text-xs font-medium text-navy/60">Onde mediu</Text>
        <View className="flex-row gap-2">
          {LOCAL_OPTIONS.map((option) => {
            const active = local === option;
            return (
              <Pressable
                key={option}
                onPress={() => setLocal(option)}
                className={`flex-1 items-center rounded-xl p-2.5 ${active ? "bg-navy" : "bg-navy/5"}`}
              >
                <Text className={`text-xs font-medium ${active ? "text-white" : "text-navy/70"}`}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          disabled={saving}
          onPress={handleAdd}
          className="items-center rounded-xl bg-navy p-3 disabled:opacity-50"
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="font-semibold text-white">Registrar</Text>
          )}
        </Pressable>
      </View>

      <Text className="mb-2 mt-5 text-sm font-semibold text-navy">Histórico</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <FlashList
        className="flex-1 bg-cream"
        data={days}
        keyExtractor={(group) => group.dateKey}
        renderItem={({ item }) => (
          <DayGroupCard
            group={item}
            expanded={expandedDays.has(item.dateKey)}
            onToggle={() => toggleDay(item.dateKey)}
            onDeleteMeasurement={confirmDelete}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text className="text-sm text-navy/60">Nenhum registro ainda.</Text>}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}
