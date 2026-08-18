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
import { apiFetch } from "@/lib/api";

type ApiHealthMeasurement = {
  id: string;
  type: "PRESSAO" | "PESO" | "GORDURA" | "GLICEMIA";
  pressaoSistolica: number | null;
  pressaoDiastolica: number | null;
  pesoKg: number | null;
  percentualGordura: number | null;
  glicemiaMgDl: number | null;
  local: string;
  measuredAt: string;
};

const TYPE_LABELS: Record<ApiHealthMeasurement["type"], string> = {
  PRESSAO: "Pressão",
  PESO: "Peso",
  GORDURA: "% Gordura",
  GLICEMIA: "Glicemia",
};

function formatMeasurement(m: ApiHealthMeasurement): string {
  if (m.type === "PRESSAO") return `${m.pressaoSistolica ?? "?"}/${m.pressaoDiastolica ?? "?"} mmHg`;
  if (m.type === "PESO") return `${m.pesoKg ?? "?"} kg`;
  if (m.type === "GORDURA") return `${m.percentualGordura ?? "?"}%`;
  return `${m.glicemiaMgDl ?? "?"} mg/dL`;
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
  const [local, setLocal] = useState("Casa");

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
      Alert.alert("Nada pra registrar", "Preencha ao menos uma medida.");
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
      Alert.alert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    Alert.alert("Remover registro", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/api/mobile/saude/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok) setMeasurements(data.measurements ?? []);
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

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-10">
      <View className="mb-4 items-center rounded-2xl bg-navy px-6 py-5">
        <Ionicons name="pulse-outline" size={26} color="#e63946" />
        <Text className="mt-1 text-lg font-semibold text-white">Saúde</Text>
        <Text className="text-center text-xs text-white/70">
          Acompanhe pressão, peso, gordura e glicemia ao longo do tempo.
        </Text>
      </View>

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
        <TextInput
          value={local}
          onChangeText={setLocal}
          placeholder="Onde mediu (casa, farmácia...)"
          className="rounded-xl border border-navy/10 p-3"
        />

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
      {measurements.length === 0 ? (
        <Text className="text-sm text-navy/60">Nenhum registro ainda.</Text>
      ) : (
        <View className="gap-2">
          {measurements.map((m) => (
            <View
              key={m.id}
              className="flex-row items-center gap-3 rounded-2xl bg-card p-3 shadow-sm"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-navy">
                  {TYPE_LABELS[m.type]}: {formatMeasurement(m)}
                </Text>
                <Text className="text-xs text-navy/50">
                  {new Date(m.measuredAt).toLocaleDateString("pt-BR")} · {m.local}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(m.id)} className="p-1.5">
                <Ionicons name="trash-outline" size={16} color="#e63946" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
