import { Fragment, useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { type ApiHealthMeasurement } from "@/lib/api";
import { LoadingScreen } from "@/components/LoadingScreen";
import { DoctorReportButton } from "@/components/DoctorReportButton";
import { SAUDE_CACHE_KEY, fetchSaude } from "@/lib/tabPrefetch";
import { getCached, loadCached } from "@/lib/tabDataCache";

// Folga interna do desenho (pontos na borda não ficam cortados pela metade).
const PLOT_PADDING = 8;
// Gráfico nunca fica menor que isso: com muitas séries numa tela pequena,
// a aba rola em vez de espremer as linhas até ficarem ilegíveis. 110 faz
// os 4 gráficos + o botão caberem num celular comum (~360x780) sem rolar.
const CHART_MIN_HEIGHT = 110;
// Coluna dos valores do eixo Y (à esquerda do desenho).
const Y_AXIS_WIDTH = 34;
// Nem maior que isso: com um gráfico só, ocupar a tela inteira esticaria
// a linha sem mostrar nada a mais.
const CHART_MAX_HEIGHT = 300;
const MAX_POINTS = 8;

function readCachedSaude() {
  return getCached<{ measurements: ApiHealthMeasurement[] }>(SAUDE_CACHE_KEY);
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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
 *
 * Ocupa a largura toda e a altura que o layout der (flex: 1 entre os
 * gráficos da tela) — por isso desenha em pixels medidos via onLayout, não
 * num viewBox fixo (um viewBox fixo esticado distorceria linhas e pontos).
 */
function MultiLineChart({ title, series }: { title: string; series: ChartSeries[] }) {
  const [plot, setPlot] = useState({ width: 0, height: 0 });
  const nonEmpty = series.filter((s) => s.points.length > 0);
  if (nonEmpty.length === 0) return null;

  function onPlotLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setPlot((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }

  const lastBySeries = nonEmpty.map((s) => s.points.slice(-MAX_POINTS));
  const allValues = lastBySeries.flat().map((p) => p.value);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min || 1;
  const innerWidth = Math.max(plot.width - PLOT_PADDING * 2, 0);
  const innerHeight = Math.max(plot.height - PLOT_PADDING * 2, 0);

  // Assume que as séries compartilham as mesmas datas (sistólica e
  // diastólica sempre vêm juntas na mesma medição) — usa a mais longa
  // como referência pra posição X e pros rótulos do eixo.
  const reference = lastBySeries.reduce((a, b) => (b.length > a.length ? b : a));
  const stepX = reference.length > 1 ? innerWidth / (reference.length - 1) : 0;
  const yOf = (value: number) => PLOT_PADDING + (1 - (value - min) / range) * innerHeight;

  const seriesCoords = nonEmpty.map((s, si) => ({
    ...s,
    coords: lastBySeries[si].map((p, i) => ({
      // ponto único fica no meio, não colado na borda esquerda
      x: reference.length > 1 ? PLOT_PADDING + i * stepX : plot.width / 2,
      y: yOf(p.value),
    })),
  }));

  const labelCount = Math.min(reference.length, 4);
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    labelCount === 1 ? 0 : Math.round((i * (reference.length - 1)) / (labelCount - 1))
  );

  return (
    <View
      className="rounded-2xl bg-card px-3 pb-2 pt-2.5 shadow-sm"
      style={{ flex: 1, minHeight: CHART_MIN_HEIGHT, maxHeight: CHART_MAX_HEIGHT }}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-navy">{title}</Text>
        <Text className="text-xs text-navy/60">
          Último:{" "}
          {/* cada número na cor da sua linha (ex.: pressão 125/80) */}
          {nonEmpty.map((s, i) => (
            <Text key={s.label} className="font-semibold" style={{ color: nonEmpty.length > 1 ? s.color : "#0b1e3d" }}>
              {i > 0 ? "/" : ""}
              {formatAxisValue(s.points[s.points.length - 1].value)}
            </Text>
          ))}
        </Text>
      </View>
      {nonEmpty.length > 1 && (
        <View className="mb-1 flex-row gap-3">
          {nonEmpty.map((s) => (
            <View key={s.label} className="flex-row items-center gap-1">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <Text className="text-[10px] text-navy/50">{s.label}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Valores do eixo Y posicionados na MESMA altura das linhas de grade
          (topo, meio e base do desenho) — a coluna e o desenho ficam lado a
          lado na mesma linha, então têm a mesma altura. */}
      <View className="flex-1 flex-row">
        <View style={{ width: Y_AXIS_WIDTH }}>
          {plot.height > 0 &&
            [max, (max + min) / 2, min].map((value, i) => (
              <Text
                key={i}
                className="text-[10px] text-navy/40"
                style={{ position: "absolute", right: 4, top: yOf(value) - 7, lineHeight: 14 }}
              >
                {formatAxisValue(value)}
              </Text>
            ))}
        </View>
        <View className="flex-1" onLayout={onPlotLayout}>
          {plot.width > 0 && plot.height > 0 && (
            <Svg width={plot.width} height={plot.height}>
              {/* linhas de grade: topo, meio e base (os 3 valores do eixo) */}
              {[PLOT_PADDING, PLOT_PADDING + innerHeight / 2, PLOT_PADDING + innerHeight].map((y, i) => (
                <Line
                  key={i}
                  x1={0}
                  x2={plot.width}
                  y1={y}
                  y2={y}
                  stroke="#0b1e3d"
                  strokeOpacity={0.06}
                  strokeWidth={1}
                />
              ))}
              {seriesCoords.map((s) => (
                <Fragment key={s.label}>
                  {s.coords.length > 1 && (
                    <Polyline
                      points={s.coords.map((c) => `${c.x},${c.y}`).join(" ")}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {s.coords.map((c, i) => (
                    <Circle key={i} cx={c.x} cy={c.y} r={3.5} fill={s.color} />
                  ))}
                </Fragment>
              ))}
            </Svg>
          )}
        </View>
      </View>
      <View className="mt-0.5 flex-row justify-between" style={{ marginLeft: Y_AXIS_WIDTH }}>
        {labelIndices.map((idx) => (
          <Text key={idx} className="text-[10px] text-navy/40">
            {reference[idx]?.date}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Aba Saúde: só a evolução — um gráfico embaixo do outro, dividindo a
 * altura da tela entre eles (rola se não couber com um tamanho legível).
 * Registrar medição e ver o histórico ficou em "Lançamentos"
 * (app/saude-lancamentos.tsx), que grava no mesmo cache lido aqui.
 */
export default function SaudeScreen() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<ApiHealthMeasurement[]>(
    () => readCachedSaude()?.measurements ?? []
  );
  const [loading, setLoading] = useState(() => readCachedSaude() === undefined);
  const loadedOnce = useRef(false);
  const hadCacheOnMount = useRef(readCachedSaude() !== undefined);

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
      if (loadedOnce.current) {
        // Voltando de Lançamentos: ela grava no mesmo cache — adota o que
        // estiver lá pra os gráficos já mostrarem a medição nova.
        const cached = readCachedSaude();
        if (cached) setMeasurements(cached.measurements ?? []);
        return;
      }
      loadedOnce.current = true;
      if (hadCacheOnMount.current) return; // já veio do cache/prefetch
      load();
    }, [load])
  );

  if (loading) {
    return <LoadingScreen />;
  }

  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  );
  const pontos = (filtro: (m: ApiHealthMeasurement) => number | null | undefined) =>
    sorted.flatMap((m) => {
      const value = filtro(m);
      return value == null ? [] : [{ date: shortDate(m.measuredAt), value }];
    });

  const charts: { title: string; series: ChartSeries[] }[] = [
    {
      title: "Peso (kg)",
      series: [{ label: "Peso", color: "#e63946", points: pontos((m) => (m.type === "PESO" ? m.pesoKg : null)) }],
    },
    {
      title: "Pressão (mmHg)",
      series: [
        {
          label: "Sistólica",
          color: "#e63946",
          points: pontos((m) => (m.type === "PRESSAO" ? m.pressaoSistolica : null)),
        },
        {
          label: "Diastólica",
          color: "#2ec4b6",
          points: pontos((m) => (m.type === "PRESSAO" ? m.pressaoDiastolica : null)),
        },
      ],
    },
    {
      title: "Gordura corporal (%)",
      series: [
        {
          label: "Gordura",
          color: "#2ec4b6",
          points: pontos((m) => (m.type === "GORDURA" ? m.percentualGordura : null)),
        },
      ],
    },
    {
      title: "Glicemia (mg/dL)",
      series: [
        {
          label: "Glicemia",
          color: "#2ec4b6",
          points: pontos((m) => (m.type === "GLICEMIA" ? m.glicemiaMgDl : null)),
        },
      ],
    },
  ].filter((c) => c.series.some((s) => s.points.length > 0));

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 12 }}
    >
      <Text className="text-sm font-semibold text-navy">Evolução</Text>

      {charts.length > 0 ? (
        <View style={{ flex: 1, gap: 12 }}>
          {charts.map((c) => (
            <MultiLineChart key={c.title} title={c.title} series={c.series} />
          ))}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center gap-2 rounded-2xl bg-card p-6 shadow-sm">
          <Ionicons name="pulse-outline" size={28} color="#0b1e3d60" />
          <Text className="text-center text-sm text-navy/60">
            Nenhuma medição ainda. Toque em Lançamentos para registrar pressão, peso, gordura ou
            glicemia.
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => router.push("/saude-lancamentos")}
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-2 rounded-full bg-navy py-3.5"
      >
        <Ionicons name="create-outline" size={18} color="#fff" />
        <Text className="font-semibold text-white">Lançamentos</Text>
      </Pressable>

      <DoctorReportButton />
    </ScrollView>
  );
}
