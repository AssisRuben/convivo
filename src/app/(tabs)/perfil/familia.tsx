import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { apiFetch, type ApiCaredPerson, type ApiCareOverview } from "@/lib/api";
import { showAlert } from "@/lib/alert";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MEASURE_LABEL: Record<string, string> = { PRESSAO: "Pressão", GLICEMIA: "Glicemia", PESO: "Peso", GORDURA: "Gordura" };

/** Cartão de quem eu acompanho: doses de hoje, sequência e últimas medições. */
function PersonCard({ person, onStop }: { person: ApiCaredPerson; onStop: () => void }) {
  const taken = person.doses.filter((d) => d.taken).length;
  return (
    <View className="gap-3 rounded-2xl bg-card p-4 shadow-sm">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-mint/15">
          <Ionicons name="heart" size={20} color="#2ec4b6" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-navy">{person.name}</Text>
          <Text className="text-xs text-navy/60">
            {person.streakDays > 0
              ? `🔥 ${person.streakDays} dia${person.streakDays > 1 ? "s seguidos" : " seguido"} cuidando de si`
              : "Sem sequência no momento"}
          </Text>
        </View>
      </View>

      {person.doses.length > 0 ? (
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Remédios de hoje · {taken} de {person.doses.length}
          </Text>
          {person.doses.map((d) => (
            <View key={d.checklistItemId} className="flex-row items-center gap-2">
              <Ionicons
                name={d.taken ? "checkmark-circle" : d.overdue ? "alert-circle" : "ellipse-outline"}
                size={18}
                color={d.taken ? "#2ec4b6" : d.overdue ? "#e63946" : "#0b1e3d40"}
              />
              <Text className="flex-1 text-sm text-navy">{d.title}</Text>
              <Text className={`text-xs font-medium ${d.taken ? "text-mint" : d.overdue ? "text-coral" : "text-navy/50"}`}>
                {d.timeOfDay ?? "sem horário"} · {d.taken ? "tomado" : d.overdue ? "atrasado" : "a tomar"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-navy/60">Nenhum remédio programado pra hoje.</Text>
      )}

      {person.latest.length > 0 && (
        <View className="gap-1 border-t border-navy/5 pt-2">
          {person.latest.map((m) => (
            <Text key={m.type} className="text-xs text-navy/70">
              {MEASURE_LABEL[m.type]}: <Text className="font-semibold">{m.value}</Text> · {formatDate(m.measuredAt)}
            </Text>
          ))}
        </View>
      )}

      <Pressable onPress={onStop} hitSlop={8} className="self-start">
        <Text className="text-xs text-navy/50 underline">Parar de acompanhar</Text>
      </Pressable>
    </View>
  );
}

/**
 * Família e cuidadores (modo cuidador): convidar alguém pra me acompanhar,
 * aceitar um convite e acompanhar as doses de quem eu cuido.
 */
export default function FamiliaScreen() {
  const [data, setData] = useState<ApiCareOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    const res = await apiFetch("/api/mobile/cuidador");
    if (res.ok) setData(await res.json());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function call(path: string, method: "POST" | "DELETE", body?: object) {
    setBusy(true);
    try {
      const res = await apiFetch(path, { method, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Não foi possível concluir");
      setData(json);
      return json;
    } catch (error) {
      showAlert("Família e cuidadores", error instanceof Error ? error.message : undefined);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function invite() {
    const json = await call("/api/mobile/cuidador/convite", "POST");
    if (json?.pendingInvite) shareInvite(json.pendingInvite.code);
  }

  function shareInvite(inviteCode: string) {
    Share.share({
      message:
        `Quero que você me acompanhe no app Convivo — vai ver meus remédios do dia e ser avisado se eu esquecer uma dose. ` +
        `No app, abra Menu > Família e cuidadores > "Tenho um código" e digite: ${inviteCode}`,
    }).catch(() => {});
  }

  async function accept() {
    const json = await call("/api/mobile/cuidador/aceitar", "POST", { code });
    if (json) {
      setCodeOpen(false);
      setCode("");
      showAlert("Pronto!", `Agora você acompanha ${json.titularName}.`);
    }
  }

  function confirmRevoke(linkId: string, text: string) {
    showAlert("Família e cuidadores", text, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", style: "destructive", onPress: () => call(`/api/mobile/cuidador/${linkId}`, "DELETE") },
    ]);
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-4 p-4 pb-24">
        <View className="gap-2">
          <Text className="text-base font-bold text-navy">Quem você acompanha</Text>
          {data.people.length === 0 && (
            <Text className="text-sm text-navy/60">
              Ninguém ainda. Peça pra pessoa gerar um convite no app dela e digite o código aqui.
            </Text>
          )}
          {data.people.map((p) => (
            <PersonCard
              key={p.linkId}
              person={p}
              onStop={() => confirmRevoke(p.linkId, `Parar de acompanhar ${p.name}? Você deixa de ver os remédios e de receber os avisos.`)}
            />
          ))}
          <Pressable
            disabled={busy}
            onPress={() => setCodeOpen(true)}
            className="flex-row items-center justify-center gap-2 rounded-full border border-navy/20 bg-card py-3"
          >
            <Ionicons name="key-outline" size={18} color="#0b1e3d" />
            <Text className="font-semibold text-navy">Tenho um código de convite</Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="text-base font-bold text-navy">Quem acompanha você</Text>
          <Text className="text-xs text-navy/60">
            Quem você convidar vê seus remédios do dia, sua sequência e suas últimas medições de
            pressão e glicemia, e é avisado se uma dose ficar 30 minutos sem marcar. Você pode
            remover quando quiser.
          </Text>
          {data.caregivers.map((c) => (
            <View key={c.linkId} className="flex-row items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
              <Ionicons name="person-circle-outline" size={28} color="#0b1e3d" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-navy">{c.name}</Text>
                <Text className="text-xs text-navy/50">Acompanha você desde {formatDate(c.since)}</Text>
              </View>
              <Pressable onPress={() => confirmRevoke(c.linkId, `Remover ${c.name}? Ele(a) deixa de ver seus remédios.`)} hitSlop={8}>
                <Text className="text-xs font-semibold text-coral">Remover</Text>
              </Pressable>
            </View>
          ))}

          {data.pendingInvite ? (
            <View className="gap-2 rounded-2xl bg-mint/10 p-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-mint">Convite aberto</Text>
              <Text className="text-center text-3xl font-extrabold tracking-[6px] text-navy">{data.pendingInvite.code}</Text>
              <Text className="text-center text-xs text-navy/60">Vale até {formatDate(data.pendingInvite.expiresAt)}</Text>
              <Pressable onPress={() => shareInvite(data.pendingInvite!.code)} className="items-center rounded-full bg-mint py-3">
                <Text className="font-semibold text-white">Enviar convite</Text>
              </Pressable>
              <Pressable
                onPress={() => call(`/api/mobile/cuidador/${data.pendingInvite!.linkId}`, "DELETE")}
                className="items-center py-1"
              >
                <Text className="text-xs text-navy/50 underline">Cancelar convite</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              disabled={busy}
              onPress={invite}
              className="flex-row items-center justify-center gap-2 rounded-full bg-navy py-3.5 disabled:opacity-50"
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text className="font-semibold text-white">Convidar alguém pra me acompanhar</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal visible={codeOpen} transparent animationType="fade" onRequestClose={() => setCodeOpen(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setCodeOpen(false)}>
            <Pressable className="gap-3 rounded-t-3xl bg-cream p-5 pb-10" onPress={() => {}}>
              <Text className="text-base font-bold text-navy">Código de convite</Text>
              <Text className="text-sm text-navy/60">Digite as 6 letras e números que a pessoa te mandou.</Text>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                autoFocus
                placeholder="Ex.: K7MP3Q"
                className="rounded-xl border border-navy/10 bg-card p-3 text-center text-2xl font-bold tracking-[6px]"
              />
              <Pressable
                disabled={busy || code.trim().length < 6}
                onPress={accept}
                className="items-center rounded-full bg-navy py-3.5 disabled:opacity-50"
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">Acompanhar</Text>}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
