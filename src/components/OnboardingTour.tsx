import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { useOnboardingTourVisibility } from "@/lib/onboardingTour";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCpfInput(text: string): string {
  const digits = onlyDigits(text).slice(0, 11);
  let out = digits.slice(0, 3);
  if (digits.length > 3) out += "." + digits.slice(3, 6);
  if (digits.length > 6) out += "." + digits.slice(6, 9);
  if (digits.length > 9) out += "-" + digits.slice(9, 11);
  return out;
}

function formatPhoneInput(text: string): string {
  const digits = onlyDigits(text).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (digits.length <= 6) return `(${ddd}) ${rest}`;
  const splitAt = digits.length > 10 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
}

type InfoStep = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  description: string;
};

const INFO_STEPS: InfoStep[] = [
  {
    icon: "checkmark-done-outline",
    color: "#2ec4b6",
    title: "Rotina de cuidados",
    description:
      "Crie lembretes diários pra remédios, medições e outros cuidados — sem esquecer nenhum.",
  },
  {
    icon: "medkit-outline",
    color: "#e63946",
    title: "Medicamentos",
    description:
      "Cadastre seus medicamentos de uso contínuo e configure a recorrência pra nunca ficar sem.",
  },
  {
    icon: "pulse-outline",
    color: "#0b1e3d",
    title: "Saúde em dia",
    description: "Registre pressão, peso e glicemia e acompanhe sua evolução em gráfico.",
  },
  {
    icon: "flag-outline",
    color: "#2ec4b6",
    title: "Suas metas",
    description: "Defina metas pessoais de saúde e acompanhe seu progresso.",
  },
  {
    icon: "medal-outline",
    color: "#e63946",
    title: "Fidelidade",
    description: "Ganhe pontos e recompensas por cuidar de você todos os dias.",
  },
];

// Passo 0 (CPF/telefone) + os passos informativos.
const TOTAL_STEPS = 1 + INFO_STEPS.length;

function Dots({ step }: { step: number }) {
  return (
    <View className="flex-row items-center justify-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${i === step ? "w-5 bg-coral" : "w-1.5 bg-navy/15"}`}
        />
      ))}
    </View>
  );
}

/**
 * Tour de boas-vindas mostrado uma vez por conta, sobre o app inteiro
 * (ver _layout.tsx). Primeiro passo pede CPF/telefone pra liberar o
 * histórico de compras (mesma verificação de meus-dados.tsx); os demais só
 * apresentam os benefícios de cada funcionalidade. Pular está sempre
 * disponível — a compra em si é feita na loja física ou pelo WhatsApp,
 * então o objetivo aqui é ensinar o uso do app, não empurrar cadastro.
 */
export function OnboardingTour() {
  const { visible, dismiss } = useOnboardingTourVisibility();
  const [step, setStep] = useState(0);
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  async function handleCpfContinue() {
    if (!cpf && !phone) {
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/mobile/profile", {
        method: "PATCH",
        body: JSON.stringify({ cpf: cpf || null, phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
      if (data.cpfVerification === "verified") {
        showAlert("CPF confirmado ✅", "Seu histórico de compras já está liberado.");
      }
      setStep(1);
    } catch (error) {
      showAlert("Erro ao salvar", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  function handleInfoContinue() {
    if (step === TOTAL_STEPS - 1) {
      dismiss();
      return;
    }
    setStep((s) => s + 1);
  }

  const info = step > 0 ? INFO_STEPS[step - 1] : null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      {/* Modal do RN abre numa janela nativa própria — não herda o
       * KeyboardAvoidingView do resto do app (login.tsx, _layout.tsx),
       * então sem um aqui o teclado cobria o campo/botão "Continuar"
       * direto, sem nada empurrar o card pra cima. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <View
        className="flex-1 items-center justify-center bg-black/50 px-6"
        style={Platform.OS === "web" ? { position: "fixed", inset: 0 } : undefined}
      >
        <View
          className="w-full gap-4 rounded-3xl bg-card p-5"
          style={{
            maxWidth: 420,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          <Pressable onPress={dismiss} className="absolute right-4 top-4 z-10" hitSlop={10}>
            <Text className="text-sm font-medium text-navy/50">Pular</Text>
          </Pressable>

          {info === null ? (
            <View className="gap-3 pr-10">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-navy/10">
                <Ionicons name="finger-print-outline" size={22} color="#0b1e3d" />
              </View>
              <Text className="text-lg font-bold text-navy">Vamos puxar seu histórico</Text>
              <Text className="text-sm text-navy/60">
                Informe seu CPF e telefone (mesmos dados da farmácia) pra liberar seu histórico de
                compras e recomendações personalizadas. Se preferir, pule e faça isso depois em
                Meus dados.
              </Text>

              <View className="gap-2.5">
                <TextInput
                  value={cpf}
                  onChangeText={(v) => setCpf(formatCpfInput(v))}
                  placeholder="CPF (000.000.000-00)"
                  placeholderTextColor="#0b1e3d60"
                  keyboardType="numeric"
                  maxLength={14}
                  className="rounded-xl border border-navy/10 bg-cream p-3.5 text-navy"
                />
                <TextInput
                  value={phone}
                  onChangeText={(v) => setPhone(formatPhoneInput(v))}
                  placeholder="Telefone (85) 91234-5678"
                  placeholderTextColor="#0b1e3d60"
                  keyboardType="phone-pad"
                  maxLength={15}
                  className="rounded-xl border border-navy/10 bg-cream p-3.5 text-navy"
                />
              </View>

              <Pressable
                disabled={saving}
                onPress={handleCpfContinue}
                className="items-center rounded-full bg-coral p-3.5 disabled:opacity-50"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">Continuar</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View className="items-center gap-3 pt-2 text-center">
              <View
                className="h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: `${info.color}1A` }}
              >
                <Ionicons name={info.icon} size={28} color={info.color} />
              </View>
              <Text className="text-center text-lg font-bold text-navy">{info.title}</Text>
              <Text className="text-center text-sm text-navy/60">{info.description}</Text>

              <Pressable
                onPress={handleInfoContinue}
                className="mt-2 w-full items-center rounded-full bg-coral p-3.5"
              >
                <Text className="font-bold text-white">
                  {step === TOTAL_STEPS - 1 ? "Começar" : "Continuar"}
                </Text>
              </Pressable>
            </View>
          )}

          <Dots step={step} />
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
