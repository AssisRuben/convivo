import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Animated, ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch, type ApiHomeDashboard, type ApiHomeDose } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useProfileDrawer } from "@/lib/profileDrawer";
import { showAlert } from "@/lib/alert";
import { HOME_CACHE_KEY, ROTINA_CACHE_KEY, fetchHomeDashboard } from "@/lib/tabPrefetch";
import { getCached, loadCached, setCached } from "@/lib/tabDataCache";
import { UserAvatar } from "@/components/UserAvatar";

function readCachedDashboard() {
  return getCached<ApiHomeDashboard>(HOME_CACHE_KEY);
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** "Dia 5 de 7" (tratamento com prazo) ou "Outubro: 9 de 10 doses" (uso
 * contínuo — soma do mês até hoje). */
function periodLabel(dose: ApiHomeDose): string | null {
  const p = dose.period;
  if (!p) return null;
  if (p.kind === "tratamento") return `Dia ${p.day} de ${p.totalDays}`;
  return `${MESES[p.month - 1]}: ${p.taken} de ${p.expected} dose${p.expected === 1 ? "" : "s"}`;
}

/** Servidor antigo só manda `nextDose` — vira uma lista de 1 item. */
function dosesOf(dashboard: ApiHomeDashboard): ApiHomeDose[] {
  if (dashboard.todayDoses) return dashboard.todayDoses;
  if (!dashboard.nextDose) return [];
  return [{ ...dashboard.nextDose, taken: false, period: null }];
}

function DoseRow({ dose, onPress }: { dose: ApiHomeDose; onPress: () => void }) {
  const periodo = periodLabel(dose);
  const status = dose.taken ? "Tomado" : dose.overdue ? "Atrasado" : "A tomar";
  const statusColor = dose.taken ? "text-mint" : dose.overdue ? "text-coral" : "text-navy/60";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: dose.taken }}
      accessibilityLabel={`${dose.title}${dose.timeOfDay ? `, ${dose.timeOfDay}` : ""}, ${status}`}
      className="flex-row items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm"
    >
      <Ionicons
        name={dose.taken ? "checkmark-circle" : "ellipse-outline"}
        size={28}
        color={dose.taken ? "#2ec4b6" : dose.overdue ? "#e63946" : "#0b1e3d40"}
      />
      <View className="flex-1 gap-0.5">
        <Text className={`font-semibold ${dose.taken ? "text-navy/50 line-through" : "text-navy"}`}>
          {dose.title}
        </Text>
        <View className="flex-row flex-wrap items-center gap-x-2">
          <Text className="text-xs text-navy/60">{dose.timeOfDay ?? "Sem horário"}</Text>
          <Text className={`text-xs font-medium ${statusColor}`}>· {status}</Text>
        </View>
        {periodo && <Text className="text-xs font-medium text-navy/70">{periodo}</Text>}
      </View>
    </Pressable>
  );
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstName(fullName: string | undefined): string {
  return fullName?.split(" ")[0] ?? "";
}

const SAUDE_TYPE_LABELS: Record<string, string> = {
  PRESSAO: "Pressão",
  PESO: "Peso",
  GORDURA: "% Gordura",
  GLICEMIA: "Glicemia",
};

const useNativeDriver = Platform.OS !== "web";

function QuickAction({
  icon,
  label,
  color,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  badge?: number;
}) {
  // Bolha colorida + leve "pulo" ao tocar — deixa a ação mais viva do que
  // o círculo cinza uniforme que tinha antes.
  const [scale] = useState(() => new Animated.Value(1));

  function animateTo(value: number) {
    Animated.spring(scale, { toValue: value, friction: 5, tension: 120, useNativeDriver }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.9)}
      onPressOut={() => animateTo(1)}
      className="flex-1 items-center gap-2 rounded-2xl bg-card px-1 py-4 shadow-sm"
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22` }}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {Boolean(badge) && (
          <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-coral">
            <Text className="text-[10px] font-bold text-white">{badge}</Text>
          </View>
        )}
      </Animated.View>
      {/* 4 cards lado a lado: em tela estreita "Recompra"/"Notícia" não
          cabiam e cortavam — encolhe a letra até 70% em vez de cortar. */}
      <Text
        className="text-sm font-bold text-navy"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Home vira um dashboard (medicamentos de hoje, recompra rápida,
 * fidelidade, ações rápidas) em vez do feed que morava aqui antes — o feed
 * (conquistas/comunidade) mudou pra Perfil > Novidades. Cada seção some
 * sozinha quando não tem dado (sem medicamento cadastrado, nada perto de
 * acabar) em vez de mostrar card vazio.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { open: openProfileDrawer } = useProfileDrawer();
  const [dashboard, setDashboard] = useState<ApiHomeDashboard | null>(() => readCachedDashboard() ?? null);
  const [loading, setLoading] = useState(() => readCachedDashboard() === undefined);
  const loadedOnce = useRef(false);
  const hadCacheOnMount = useRef(readCachedDashboard() !== undefined);
  // Mesmo esquema do toggleComplete da Rotina: marca na hora e guarda a
  // última intenção por dose, pra resposta atrasada não desfazer um toque
  // mais novo. `inFlight` evita que o recarregamento de uma dose apague o
  // estado otimista de outra que ainda está indo pro servidor.
  const latestToggleIntent = useRef<Map<string, boolean>>(new Map());
  const inFlight = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCached(HOME_CACHE_KEY, fetchHomeDashboard);
      setDashboard(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) {
        // A Rotina invalida o cache da Home quando marca/edita algo —
        // aqui refaz a busca pra lista de doses refletir o status novo.
        if (readCachedDashboard() === undefined) {
          fetchHomeDashboard()
            .then(setDashboard)
            .catch(() => {});
        }
        return;
      }
      loadedOnce.current = true;
      if (hadCacheOnMount.current) return; // já veio do cache/prefetch
      load();
    }, [load])
  );

  // Espelha o state atual no cache — cobre a carga inicial e qualquer
  // mutação (marcar dose), sem precisar sincronizar em cada handler.
  useEffect(() => {
    if (!loading && dashboard) setCached(HOME_CACHE_KEY, dashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard]);

  function setDoseTaken(checklistItemId: string, taken: boolean) {
    setDashboard((prev) =>
      prev
        ? {
            ...prev,
            todayDoses: dosesOf(prev).map((d) =>
              d.checklistItemId === checklistItemId
                ? { ...d, taken, overdue: taken ? false : d.overdue }
                : d
            ),
          }
        : prev
    );
  }

  // Toque na dose marca/desmarca — é a mesma conclusão da aba Rotina
  // (rotina/[id]/complete), então o status fica igual nas duas telas.
  async function toggleDose(dose: ApiHomeDose) {
    const id = dose.checklistItemId;
    const next = !dose.taken;
    latestToggleIntent.current.set(id, next);
    setDoseTaken(id, next);
    inFlight.current += 1;

    let saved = false;
    try {
      const res = await apiFetch(`/api/mobile/rotina/${id}/complete`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error();
      // A resposta é a lista da Rotina já atualizada — a aba Rotina adota
      // esse cache quando ganhar foco.
      setCached(ROTINA_CACHE_KEY, await res.json());
      saved = true;
    } catch {
      // tratado abaixo
    }
    inFlight.current -= 1;

    if (!saved) {
      if (latestToggleIntent.current.get(id) === next) {
        setDoseTaken(id, !next);
        showAlert("Não foi possível salvar", "Sua conexão pode estar instável — tente de novo.");
      }
      return;
    }

    // Recarrega pra atualizar a soma do mês (uso contínuo) e o "atrasado"
    // de quem foi desmarcado — só se não tem outro toque pendente, senão
    // sobrescreveria o estado otimista dele.
    if (inFlight.current === 0) {
      try {
        const fresh = await fetchHomeDashboard();
        if (inFlight.current === 0) setDashboard(fresh);
      } catch {
        // a marcação já foi salva; a soma atualiza na próxima carga
      }
    }
  }

  // recomprar+api.ts cria o pedido de verdade (exige forma de pagamento) —
  // não dá pra disparar direto daqui sem esses dados. "Recompra Rápida" na
  // Home é a porta de entrada mais curta pra tela que já resolve isso
  // (perfil/medicamentos/[id]/recomprar.tsx), não uma compra em 1 toque.
  function quickRepurchase(medicationTrackingId: string) {
    router.push({
      pathname: "/perfil/medicamentos/[id]/recomprar",
      params: { id: medicationTrackingId },
    });
  }

  if (loading || !dashboard) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const doses = dosesOf(dashboard);
  // Servidor antigo não manda a contagem: trata como "sem remédio" (o
  // card leva pro cadastro, que também mostra a lista).
  const hasMedications = (dashboard.activeMedicationsCount ?? 0) > 0;
  const tomadas = doses.filter((d) => d.taken).length;

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-4 p-4 pb-24">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <UserAvatar size={64} />
          <View>
            <Text className="text-sm text-navy/60">Olá,</Text>
            <Text className="text-lg font-bold text-navy">{firstName(user?.name)}.</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/perfil/novidades")}>
            <Ionicons name="notifications-outline" size={24} color="#0b1e3d" />
          </Pressable>
          <Pressable onPress={openProfileDrawer}>
            <Ionicons name="person-outline" size={24} color="#0b1e3d" />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/(tabs)/catalogo")}
        className="flex-row items-center gap-2 rounded-2xl bg-card p-3.5 shadow-sm"
      >
        <Ionicons name="search-outline" size={18} color="#0b1e3d60" />
        <Text className="text-navy/50">Buscar remédios e produtos...</Text>
      </Pressable>

      {doses.length > 0 && (
        <View className="gap-2 rounded-2xl bg-mint/10 p-3">
          <View className="flex-row items-center justify-between px-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="calendar-outline" size={14} color="#2ec4b6" />
              <Text className="text-xs font-semibold text-mint">Medicamentos de hoje</Text>
            </View>
            <Text className="text-xs text-navy/60">
              {tomadas} de {doses.length} tomado{doses.length === 1 ? "" : "s"}
            </Text>
          </View>
          {doses.map((dose) => (
            <DoseRow key={dose.checklistItemId} dose={dose} onPress={() => toggleDose(dose)} />
          ))}
          <View className="flex-row items-center justify-between px-1">
            <Text className="flex-1 text-[11px] text-navy/50">
              Toque no remédio para marcar como tomado (ou desmarcar).
            </Text>
            <Pressable onPress={() => router.push("/perfil/medicamentos/novo")} hitSlop={8}>
              <Text className="text-xs font-semibold text-mint">+ Adicionar remédio</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Sem dose hoje (nenhum remédio cadastrado, ou nenhum pra hoje): porta
          de entrada direto pro cadastro — antes só se chegava lá pelo Menu >
          Histórico de compras, e quem testou não achou. */}
      {doses.length === 0 && (
        <Pressable
          onPress={() =>
            router.push(hasMedications ? "/perfil/medicamentos" : "/perfil/medicamentos/novo")
          }
          className="flex-row items-center gap-3 rounded-2xl bg-mint/10 p-4"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-mint/20">
            <Ionicons name="medkit" size={22} color="#2ec4b6" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-navy">Meus remédios</Text>
            <Text className="text-xs text-navy/60">
              {hasMedications
                ? "Nenhuma dose pra hoje · toque pra ver seus remédios"
                : "Cadastre seu remédio e receba lembretes na hora certa."}
            </Text>
          </View>
          <Ionicons
            name={hasMedications ? "chevron-forward" : "add-circle"}
            size={hasMedications ? 18 : 26}
            color="#2ec4b6"
          />
        </Pressable>
      )}

      {dashboard.repurchaseReady.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-navy">Meus Medicamentos</Text>
            <Text className="text-xs text-navy/50">(Prontos para recompra)</Text>
          </View>
          {dashboard.repurchaseReady.map((med) => (
            <View
              key={med.medicationTrackingId}
              className="flex-row items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-navy/5">
                <Ionicons name="medkit-outline" size={20} color="#0b1e3d" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-navy">{med.productName}</Text>
                <Text className="text-xs text-navy/50">
                  {med.daysUntilRunOut <= 0
                    ? "Já deve ter acabado"
                    : `Acaba em ${med.daysUntilRunOut} dia${med.daysUntilRunOut > 1 ? "s" : ""}`}
                </Text>
              </View>
              {/* Remédio digitado à mão não tem produto da farmácia — a
                  recompra daria erro; o atalho vira "Comprei mais". */}
              {med.codigoProduto != null ? (
                <Pressable
                  onPress={() => quickRepurchase(med.medicationTrackingId)}
                  className="rounded-full bg-mint px-4 py-2.5"
                >
                  <Text className="text-xs font-semibold text-white">Recompra Rápida</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/perfil/medicamentos",
                      params: { comprei: med.medicationTrackingId },
                    })
                  }
                  className="rounded-full border border-mint px-4 py-2.5"
                >
                  <Text className="text-xs font-semibold text-mint">Comprei mais</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => router.push("/perfil/fidelidade")}
        className="flex-row items-center gap-3 rounded-2xl bg-card p-4 shadow-sm"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-navy/5">
          <Ionicons name="star" size={20} color="#0b1e3d" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-navy">Cartão Fidelidade</Text>
          <Text className="text-xs text-navy/50">
            {dashboard.loyalty.stampsFilled} de {dashboard.loyalty.stampsTotal} selos ·{" "}
            {formatPrice(dashboard.loyalty.totalRewardCents)} em benefícios
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#0b1e3d60" />
      </Pressable>

      <View className="gap-2">
        <Text className="text-base font-bold text-navy">Minhas trilhas</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/perfil/pilulas-sabedoria")}
            className="flex-1 gap-1.5 rounded-2xl bg-card p-3.5 shadow-sm"
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="bulb" size={16} color="#f59e0b" />
              <Text className="text-xs font-semibold text-navy">Pílulas de sabedoria</Text>
            </View>
            <Text className="text-xs text-navy/50">
              {dashboard.wisdom.chaptersRead} de {dashboard.wisdom.totalChapters} capítulos
            </Text>
            {dashboard.wisdom.bestStreak > 0 && (
              <Text className="text-xs font-medium text-coral">🔥 {dashboard.wisdom.bestStreak} dias</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push("/perfil/gotas-de-fe")}
            className="flex-1 gap-1.5 rounded-2xl bg-card p-3.5 shadow-sm"
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="water" size={16} color="#3b82f6" />
              <Text className="text-xs font-semibold text-navy">Gotas de Fé</Text>
            </View>
            <Text className="text-xs text-navy/50">
              {dashboard.faith.chaptersRead} de {dashboard.faith.totalChapters} capítulos
            </Text>
            {dashboard.faith.bestStreak > 0 && (
              <Text className="text-xs font-medium text-mint">🙏 {dashboard.faith.bestStreak} dias</Text>
            )}
          </Pressable>
        </View>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={() => router.push("/(tabs)/rotina")}
          className="flex-1 flex-row items-center gap-2.5 rounded-2xl bg-card p-3.5 shadow-sm"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-mint/15">
            <Ionicons name="checkmark-done" size={16} color="#2ec4b6" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-navy">Rotina</Text>
            <Text className="text-xs text-navy/50">
              {dashboard.rotina.totalToday === 0
                ? "Nada pra hoje"
                : `${dashboard.rotina.doneToday} de ${dashboard.rotina.totalToday} feitos`}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/saude")}
          className="flex-1 flex-row items-center gap-2.5 rounded-2xl bg-card p-3.5 shadow-sm"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-navy/5">
            <Ionicons name="pulse" size={16} color="#0b1e3d" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-navy">Saúde</Text>
            <Text className="text-xs text-navy/50">
              {dashboard.saude
                ? `${SAUDE_TYPE_LABELS[dashboard.saude.type] ?? dashboard.saude.type} · ${
                    dashboard.saude.daysAgo === 0 ? "hoje" : `há ${dashboard.saude.daysAgo}d`
                  }`
                : "Nenhum registro ainda"}
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="text-base font-bold text-navy">Ações Rápidas</Text>
        <View className="flex-row gap-3">
          <QuickAction
            icon="star"
            color="#f59e0b"
            label="Pontos"
            onPress={() => router.push("/perfil/fidelidade")}
          />
          <QuickAction
            icon="pricetag"
            color="#e63946"
            label="Ofertas"
            badge={dashboard.activePromotionsCount || undefined}
            onPress={() => router.push("/ofertas")}
          />
          <QuickAction
            icon="newspaper"
            color="#3b82f6"
            label="Notícia"
            onPress={() => router.push("/perfil/novidades")}
          />
          <QuickAction
            icon="medkit"
            color="#2ec4b6"
            label="Recompra"
            onPress={() => router.push("/perfil/medicamentos")}
          />
        </View>
      </View>
    </ScrollView>
  );
}
