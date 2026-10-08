import { useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, Share, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { absoluteApiUrl, apiFetch } from "@/lib/api";
import { showAlert } from "@/lib/alert";

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function monthOption(offset: number): { key: string; label: string } {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - offset);
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return { key, label: MONTHS_PT[date.getMonth()] };
}

/**
 * "Relatório para o médico": gera o link do mês escolhido (válido por 7
 * dias) e abre o compartilhamento do celular — WhatsApp, e-mail etc.
 * O médico abre no navegador, pode imprimir ou salvar em PDF.
 */
export function DoctorReportButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const options = [
    { ...monthOption(0), title: "Este mês" },
    { ...monthOption(1), title: "Mês passado" },
  ];

  async function generate(month: string, label: string) {
    setBusy(month);
    try {
      const res = await apiFetch("/api/mobile/relatorio", { method: "POST", body: JSON.stringify({ month }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível gerar o relatório");
      const url = absoluteApiUrl(data.path);
      setOpen(false);
      if (Platform.OS === "web") {
        await Linking.openURL(url);
        return;
      }
      await Share.share({
        message: `Meu relatório de saúde de ${label} (remédios, medições e rotina). O link vale por 7 dias: ${url}`,
      });
    } catch (error) {
      showAlert("Relatório para o médico", error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-2 rounded-full border border-navy/20 bg-card py-3.5"
      >
        <Ionicons name="document-text-outline" size={18} color="#0b1e3d" />
        <Text className="font-semibold text-navy">Relatório para o médico</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="gap-2 rounded-t-3xl bg-cream p-5 pb-10" onPress={() => {}}>
            <Text className="text-center text-base font-bold text-navy">Relatório para o médico</Text>
            <Text className="mb-1 text-center text-sm text-navy/60">
              Remédios (doses tomadas), medições e rotina do mês. Você recebe um link pra mandar
              pelo WhatsApp — o médico abre no navegador e pode imprimir.
            </Text>
            {options.map((o) => (
              <Pressable
                key={o.key}
                disabled={busy !== null}
                onPress={() => generate(o.key, o.label)}
                className="flex-row items-center gap-3 rounded-2xl bg-card p-4 disabled:opacity-50"
              >
                <Ionicons name="calendar-outline" size={20} color="#0b1e3d" />
                <View className="flex-1">
                  <Text className="text-base font-medium text-navy">{o.title}</Text>
                  <Text className="text-xs capitalize text-navy/50">{o.label}</Text>
                </View>
                {busy === o.key ? <ActivityIndicator color="#0b1e3d" /> : <Ionicons name="share-outline" size={18} color="#0b1e3d80" />}
              </Pressable>
            ))}
            <Pressable onPress={() => setOpen(false)} className="mt-1 items-center rounded-full py-3">
              <Text className="text-sm font-semibold text-navy/60">Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
