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
import { apiFetch, type ApiProfile, type ProfileInput } from "@/lib/api";

type FormState = {
  name: string;
  cpf: string;
  phone: string;
  birthDate: string;
  cep: string;
  estado: string;
  cidade: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string;
  heightCm: string;
  conditions: string;
  allergies: string;
};

function toFormState(profile: ApiProfile): FormState {
  return {
    name: profile.name,
    cpf: profile.cpf ?? "",
    phone: profile.phone ?? "",
    birthDate: profile.birthDate ?? "",
    cep: profile.cep ?? "",
    estado: profile.estado ?? "",
    cidade: profile.cidade ?? "",
    logradouro: profile.logradouro ?? "",
    numero: profile.numero ?? "",
    bairro: profile.bairro ?? "",
    complemento: profile.complemento ?? "",
    heightCm: profile.heightCm != null ? String(profile.heightCm) : "",
    conditions: profile.conditions.join(", "),
    allergies: profile.allergies.join(", "),
  };
}

function toInput(form: FormState): ProfileInput {
  return {
    name: form.name,
    cpf: form.cpf || null,
    phone: form.phone || null,
    birthDate: form.birthDate || null,
    cep: form.cep || null,
    estado: form.estado || null,
    cidade: form.cidade || null,
    logradouro: form.logradouro || null,
    numero: form.numero || null,
    bairro: form.bairro || null,
    complemento: form.complemento || null,
    heightCm: form.heightCm ? Number(form.heightCm) : null,
    conditions: form.conditions
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    allergies: form.allergies
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
  };
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "characters" | "words";
}) {
  return (
    <View className="gap-1">
      <Text className="text-xs font-medium text-navy/60">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        className="rounded-xl border border-navy/10 bg-card p-3"
      />
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="mb-1 mt-5 text-sm font-semibold text-navy">{children}</Text>;
}

export default function MeusDadosScreen() {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/mobile/profile");
      if (res.ok) {
        const data = await res.json();
        setForm(toFormState(data.profile));
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

  function update(field: keyof FormState, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/mobile/profile", {
        method: "PATCH",
        body: JSON.stringify(toInput(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
      setForm(toFormState(data.profile));
      Alert.alert("Pronto", "Dados atualizados.");
    } catch (error) {
      Alert.alert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="p-4 pb-10">
      <SectionTitle>Dados pessoais</SectionTitle>
      <View className="gap-3">
        <Field label="Nome completo" value={form.name} onChangeText={(v) => update("name", v)} />
        <Field
          label="CPF"
          value={form.cpf}
          onChangeText={(v) => update("cpf", v)}
          placeholder="000.000.000-00"
          keyboardType="numeric"
        />
        <Field
          label="Telefone"
          value={form.phone}
          onChangeText={(v) => update("phone", v)}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
        />
        <Field
          label="Data de nascimento"
          value={form.birthDate}
          onChangeText={(v) => update("birthDate", v)}
          placeholder="AAAA-MM-DD"
        />
      </View>

      <SectionTitle>Endereço</SectionTitle>
      <View className="gap-3">
        <Field
          label="CEP"
          value={form.cep}
          onChangeText={(v) => update("cep", v)}
          placeholder="00000-000"
          keyboardType="numeric"
        />
        <Field
          label="Estado (UF)"
          value={form.estado}
          onChangeText={(v) => update("estado", v)}
          placeholder="SP"
          autoCapitalize="characters"
        />
        <Field label="Cidade" value={form.cidade} onChangeText={(v) => update("cidade", v)} />
        <Field
          label="Logradouro"
          value={form.logradouro}
          onChangeText={(v) => update("logradouro", v)}
          placeholder="Rua, avenida..."
        />
        <Field
          label="Número"
          value={form.numero}
          onChangeText={(v) => update("numero", v)}
          keyboardType="numeric"
        />
        <Field label="Bairro" value={form.bairro} onChangeText={(v) => update("bairro", v)} />
        <Field
          label="Complemento"
          value={form.complemento}
          onChangeText={(v) => update("complemento", v)}
          placeholder="Apto, bloco... (opcional)"
        />
      </View>

      <SectionTitle>Saúde</SectionTitle>
      <View className="gap-3">
        <Field
          label="Altura (cm)"
          value={form.heightCm}
          onChangeText={(v) => update("heightCm", v)}
          placeholder="170"
          keyboardType="numeric"
        />
        <Field
          label="Enfermidades / condições"
          value={form.conditions}
          onChangeText={(v) => update("conditions", v)}
          placeholder="Separe por vírgula: hipertensão, diabetes..."
        />
        <Field
          label="Alergias"
          value={form.allergies}
          onChangeText={(v) => update("allergies", v)}
          placeholder="Separe por vírgula: dipirona, látex..."
        />
      </View>

      <Pressable
        disabled={saving}
        onPress={handleSave}
        className="mt-6 items-center rounded-xl bg-navy p-3.5 disabled:opacity-50"
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-semibold text-white">Salvar</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
