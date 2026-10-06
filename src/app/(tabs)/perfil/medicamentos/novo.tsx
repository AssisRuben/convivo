import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import { invalidateCached } from "@/lib/tabDataCache";
import { HOME_CACHE_KEY, ROTINA_CACHE_KEY } from "@/lib/tabPrefetch";
import { MedicationForm } from "@/components/MedicationForm";

type Suggestion = {
  codigoProduto: number;
  productName: string;
  purchaseDate: string;
  packQuantity: number;
  suggestedUnits: number | null;
};

type Chosen = {
  productName: string;
  codigoProduto: number | null;
  purchaseDate: string | null;
  packQuantity: number;
  suggestedUnits: number | null;
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Cadastro de remédio numa tela só: primeiro escolhe o remédio — das
 * compras feitas na farmácia (já vem com produto pra recompra e sugestão
 * de quantidade) ou digitando qualquer nome (comprado em outro lugar) —,
 * depois o mesmo formulário de sempre. Antes o único caminho era Menu >
 * Histórico de compras, e quem testou não achou.
 */
export default function NovoMedicamentoScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);

  useEffect(() => {
    apiFetch("/api/mobile/medicamentos/sugestoes")
      .then((res) => (res.ok ? res.json() : { suggestions: [] }))
      .then((data: { suggestions?: Suggestion[] }) =>
        setSuggestions(data.suggestions ?? []),
      )
      .catch(() => setSuggestions([]));
  }, []);

  if (chosen) {
    return (
      <MedicationForm
        productName={chosen.productName}
        initial={{ totalUnits: chosen.suggestedUnits }}
        unitsHint={
          chosen.suggestedUnits
            ? `Sugestão pela sua compra (${chosen.packQuantity} caixa${chosen.packQuantity > 1 ? "s" : ""}). Ajuste se já tomou alguns.`
            : undefined
        }
        submitLabel="Salvar e ativar lembretes"
        onSubmit={async (values) => {
          const res = await apiFetch("/api/mobile/medicamentos", {
            method: "POST",
            body: JSON.stringify({
              ...values,
              productName: chosen.productName,
              codigoProduto: chosen.codigoProduto,
              purchaseDate: chosen.purchaseDate,
              packQuantity: chosen.packQuantity,
            }),
          });
          const data = await res.json();
          if (!res.ok)
            throw new Error(data?.error ?? "Não foi possível salvar");
          invalidateCached(HOME_CACHE_KEY);
          invalidateCached(ROTINA_CACHE_KEY);
          router.replace("/perfil/medicamentos");
        }}
      />
    );
  }

  const typed = query.trim();
  const normalized = typed.toUpperCase();
  const filtered = (suggestions ?? []).filter(
    (s) => !normalized || s.productName.toUpperCase().includes(normalized),
  );

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerClassName="gap-3 p-4 pb-24"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-lg font-bold text-navy">Qual remédio?</Text>
      <View className="flex-row items-center gap-2 rounded-xl border border-navy/10 bg-card px-3">
        <Ionicons name="search" size={18} color="#0b1e3d80" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Digite o nome (ex.: Losartana)"
          autoCapitalize="characters"
          autoFocus
          className="flex-1 py-3"
        />
      </View>

      {typed.length > 0 && (
        <Pressable
          onPress={() =>
            setChosen({
              productName: typed,
              codigoProduto: null,
              purchaseDate: null,
              packQuantity: 1,
              suggestedUnits: null,
            })
          }
          className="flex-row items-center gap-3 rounded-2xl bg-mint/10 p-4"
        >
          <Ionicons name="add-circle" size={22} color="#2ec4b6" />
          <Text className="flex-1 text-sm text-navy">
            Cadastrar <Text className="font-semibold">“{typed}”</Text>
          </Text>
        </Pressable>
      )}

      {suggestions === null ? (
        <ActivityIndicator color="#0b1e3d" className="mt-4" />
      ) : (
        filtered.length > 0 && (
          <View className="gap-2">
            <Text className="mt-2 text-xs font-semibold uppercase tracking-wide text-navy/50">
              Das suas compras na farmácia
            </Text>
            {filtered.map((s) => (
              <Pressable
                key={s.codigoProduto}
                onPress={() => setChosen(s)}
                className="flex-row items-center gap-3 rounded-2xl bg-card p-4 shadow-sm"
              >
                <Ionicons name="medkit-outline" size={20} color="#0b1e3d" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-navy">
                    {s.productName}
                  </Text>
                  <Text className="text-xs text-navy/50">
                    Comprado em {formatDate(s.purchaseDate)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#0b1e3d60" />
              </Pressable>
            ))}
          </View>
        )
      )}

      {suggestions !== null &&
        suggestions.length === 0 &&
        typed.length === 0 && (
          <Text className="mt-2 text-sm text-navy/60">
            Digite o nome do remédio acima. Se você comprou aqui na farmácia e
            confirmou seu CPF, suas compras aparecem nesta lista.
          </Text>
        )}
    </ScrollView>
  );
}
