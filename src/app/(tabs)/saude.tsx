import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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
import { apiFetch, type ApiHealthMeasurement, type ApiHealthMeasurementType } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SAUDE_CACHE_KEY, fetchSaude } from "@/lib/tabPrefetch";
import { getCached, loadCached, setCached } from "@/lib/tabDataCache";

const CHART_WIDTH = 140;
const CHART_HEIGHT = 80;
const CHART_PADDING = 8;

const cachedSaude = getCached<{ measurements: ApiHealthMeasurement[] }>(SAUDE_CACHE_KEY);

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

type ChartSeries = { label: string; color: string; points: { date: string; value: number }[] };

function formatAxisValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Aceita várias séries no mesmo gráfico (ex: sistólica + diastólica) —
 * todas compartilham a mesma escala Y (min/max combinado de todas),
 * senão cada linha normalizada separadamente esconderia a diferença real
 * entre sistólica e diastólica, que é justamente o que importa ver.
 * Eixo X mostra pelo menos 3 datas quando há pontos suficientes (antes
 * só mostrava a primeira e a última, escondendo o meio da evolução).
 */
function MultiLineChart({ title, series }: { title: string; series: ChartSeries[] }) {
  const nonEmpty = series.filter((s) => s.points.length > 0);
  if (nonEmpty.length === 0) return null;

  const lastBySeries = nonEmpty.map((s) => s.points.slice(-8));
  const allValues = lastBySeries.flat().map((p) => p.value);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min || 1;
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  // Assume que as séries compartilham as mesmas datas (sistólica e
  // diastólica sempre vêm juntas na mesma medição) — usa a mais longa
  // como referência pra posição X e pros rótulos do eixo.
  const reference = lastBySeries.reduce((a, b) => (b.length > a.length ? b : a));
  const stepX = reference.length > 1 ? innerWidth / (reference.length - 1) : 0;

  const seriesCoords = nonEmpty.map((s, si) => ({
    ...s,
    coords: lastBySeries[si].map((p, i) => ({
      x: CHART_PADDING + i * stepX,
      y: CHART_PADDING + (1 - (p.value - min) / range) * innerHeight,
    })),
  }));

  const labelCount = Math.min(reference.length, 4);
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    labelCount === 1 ? 0 : Math.round((i * (reference.length - 1)) / (labelCount - 1))
  );

  return (
    <View className="w-[48%] rounded-2xl bg-card p-3 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-navy">{title}</Text>
        {nonEmpty.length > 1 && (
          <View className="flex-row gap-2">
            {nonEmpty.map((s) => (
              <View key={s.label} className="flex-row items-center gap-1">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <Text className="text-[9px] text-navy/50">{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View className="flex-row">
        <View style={{ height: CHART_HEIGHT }} className="mr-1 justify-between">
          <Text className="text-[9px] leading-[9px] text-navy/40">{formatAxisValue(max)}</Text>
          <Text className="text-[9px] leading-[9px] text-navy/40">
            {formatAxisValue((max + min) / 2)}
          </Text>
          <Text className="text-[9px] leading-[9px] text-navy/40">{formatAxisValue(min)}</Text>
        </View>
        <View className="flex-1">
          <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
            {seriesCoords.map((s) => (
              <Fragment key={s.label}>
                <Polyline
                  points={s.coords.map((c) => `${c.x},${c.y}`).join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {s.coords.map((c, i) => (
                  <Circle key={i} cx={c.x} cy={c.y} r={2.5} fill={s.color} />
                ))}
              </Fragment>
            ))}
          </Svg>
          <View className="mt-1 flex-row justify-between">
            {labelIndices.map((idx) => (
              <Text key={idx} className="text-[10px] text-navy/40">
                {reference[idx]?.date}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function SaudeScreen() {
  const [measurements, setMeasurements] = useState<ApiHealthMeasurement[]>(
    cachedSaude?.measurements ?? []
  );
  const [loading, setLoading] = useState(cachedSaude === undefined);
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
      if (cachedSaude !== undefined) return; // já veio do cache/prefetch
      load();
    }, [load])
  );

  // Espelha o state atual no cache — cobre a carga inicial e qualquer
  // mutação (novo registro, remoção) sem precisar sincronizar em cada
  // handler.
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

  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  );
  const pesoPoints = sorted
    .filter((m) => m.type === "PESO" && m.pesoKg != null)
    .map((m) => ({ date: shortDate(m.measuredAt), value: m.pesoKg! }));
  const sistolicaPoints = sorted
    .filter((m) => m.type === "PRESSAO" && m.pressaoSistolica != null)
    .map((m) => ({ date: shortDate(m.measuredAt), value: m.pressaoSistolica! }));
  const diastolicaPoints = sorted
    .filter((m) => m.type === "PRESSAO" && m.pressaoDiastolica != null)
    .map((m) => ({ date: shortDate(m.measuredAt), value: m.pressaoDiastolica! }));
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
        diastolicaPoints.length > 0 ||
        gorduraPoints.length > 0 ||
        glicemiaPoints.length > 0) && (
        <>
          <Text className="mb-2 text-sm font-semibold text-navy">Evolução</Text>
          <View className="mb-5 flex-row flex-wrap justify-between gap-y-3">
            <MultiLineChart
              title="Peso (kg)"
              series={[{ label: "Peso", color: "#e63946", points: pesoPoints }]}
            />
            <MultiLineChart
              title="Pressão (mmHg)"
              series={[
                { label: "Sistólica", color: "#e63946", points: sistolicaPoints },
                { label: "Diastólica", color: "#2ec4b6", points: diastolicaPoints },
              ]}
            />
            <MultiLineChart
              title="Gordura corporal (%)"
              series={[{ label: "Gordura", color: "#2ec4b6", points: gorduraPoints }]}
            />
            <MultiLineChart
              title="Glicemia (mg/dL)"
              series={[{ label: "Glicemia", color: "#2ec4b6", points: glicemiaPoints }]}
            />
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
