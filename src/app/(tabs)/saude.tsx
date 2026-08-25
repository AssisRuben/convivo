import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Polyline } from "react-native-svg";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";

const CHART_WIDTH = 140;
const CHART_HEIGHT = 80;
const CHART_PADDING = 8;

type MeasurementType = "PRESSAO" | "PESO" | "GORDURA" | "GLICEMIA";

type ApiHealthMeasurement = {
  id: string;
  type: MeasurementType;
  pressaoSistolica: number | null;
  pressaoDiastolica: number | null;
  pesoKg: number | null;
  percentualGordura: number | null;
  glicemiaMgDl: number | null;
  local: string;
  measuredAt: string;
};

const TYPE_LABELS: Record<MeasurementType, string> = {
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

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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

function MiniLineChart({
  title,
  points,
  color,
}: {
  title: string;
  points: { date: string; value: number }[];
  color: string;
}) {
  if (points.length === 0) return null;
  const last = points.slice(-8);
  const max = Math.max(...last.map((p) => p.value));
  const min = Math.min(...last.map((p) => p.value));
  const range = max - min || 1;
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;
  const stepX = last.length > 1 ? innerWidth / (last.length - 1) : 0;

  const coords = last.map((p, i) => ({
    x: CHART_PADDING + i * stepX,
    y: CHART_PADDING + (1 - (p.value - min) / range) * innerHeight,
  }));

  return (
    <View className="w-[48%] rounded-2xl bg-card p-3 shadow-sm">
      <Text className="mb-2 text-xs font-medium text-navy">{title}</Text>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Polyline
          points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={2.5} fill={color} />
        ))}
      </Svg>
      <View className="mt-1 flex-row justify-between">
        <Text className="text-[10px] text-navy/40">{last[0]?.date}</Text>
        <Text className="text-[10px] text-navy/40">{last[last.length - 1]?.date}</Text>
      </View>
    </View>
  );
}

export default function SaudeScreen() {
  const [measurements, setMeasurements] = useState<ApiHealthMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadedOnce = useRef(false);

  const [pesoKg, setPesoKg] = useState("");
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [gordura, setGordura] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [local, setLocal] = useState(LOCAL_OPTIONS[0]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/saude");
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data.measurements ?? []);
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
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  );
  const pesoPoints = sorted
    .filter((m) => m.type === "PESO" && m.pesoKg != null)
    .map((m) => ({ date: shortDate(m.measuredAt), value: m.pesoKg! }));
  const sistolicaPoints = sorted
    .filter((m) => m.type === "PRESSAO" && m.pressaoSistolica != null)
    .map((m) => ({ date: shortDate(m.measuredAt), value: m.pressaoSistolica! }));
  const gorduraPoints = sorted
    .filter((m) => m.type === "GORDURA" && m.percentualGordura != null)
    .map((m) => ({ date: shortDate(m.measuredAt), value: m.percentualGordura! }));
  const glicemiaPoints = sorted
    .filter((m) => m.type === "GLICEMIA" && m.glicemiaMgDl != null)
    .map((m) => ({ date: shortDate(m.measuredAt), value: m.glicemiaMgDl! }));

  const days = groupByDay(measurements);

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-24">
      {(pesoPoints.length > 0 ||
        sistolicaPoints.length > 0 ||
        gorduraPoints.length > 0 ||
        glicemiaPoints.length > 0) && (
        <>
          <Text className="mb-2 text-sm font-semibold text-navy">Evolução</Text>
          <View className="mb-5 flex-row flex-wrap justify-between gap-y-3">
            <MiniLineChart title="Peso (kg)" points={pesoPoints} color="#e63946" />
            <MiniLineChart title="Pressão sistólica" points={sistolicaPoints} color="#e63946" />
            <MiniLineChart title="Gordura corporal (%)" points={gorduraPoints} color="#2ec4b6" />
            <MiniLineChart title="Glicemia (mg/dL)" points={glicemiaPoints} color="#2ec4b6" />
          </View>
        </>
      )}

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
      {days.length === 0 ? (
        <Text className="text-sm text-navy/60">Nenhum registro ainda.</Text>
      ) : (
        <View className="gap-2">
          {days.map((group) => (
            <View key={group.dateKey} className="rounded-2xl bg-card p-3 shadow-sm">
              <Text className="mb-1 text-sm font-semibold text-navy">{group.dateLabel}</Text>
              {group.measurements.map((m) => (
                <View key={m.id} className="flex-row items-center gap-2 py-1">
                  <Text className="flex-1 text-sm text-navy/70">
                    {TYPE_LABELS[m.type]}: {formatMeasurement(m)}{" "}
                    <Text className="text-xs text-navy/40">· {m.local}</Text>
                  </Text>
                  <Pressable
                    onPress={() => confirmDelete(m.id)}
                    accessibilityLabel="Remover medição"
                    hitSlop={12}
                    className="p-2.5"
                  >
                    <Ionicons name="trash-outline" size={15} color="#e63946" />
                  </Pressable>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
