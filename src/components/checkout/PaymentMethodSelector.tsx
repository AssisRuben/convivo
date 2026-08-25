import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CheckoutFormState, CheckoutPaymentMethod } from "@/hooks/useCheckoutForm";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const OPTIONS: { value: CheckoutPaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "ONLINE_MP", label: "Mercado Pago", icon: "card-outline" },
  { value: "CARTAO_PRESENCIAL", label: "Cartão na loja", icon: "card" },
  { value: "DINHEIRO", label: "Dinheiro", icon: "cash-outline" },
];

/**
 * Esconde a opção de Mercado Pago quando não está configurado (em vez de
 * deixar escolher algo que só ia falhar depois no servidor) — mesma ideia
 * de nunca mostrar um caminho morto pro usuário.
 */
export function PaymentMethodSelector({
  form,
  totalCents,
}: {
  form: CheckoutFormState;
  totalCents: number;
}) {
  const options = OPTIONS.filter((o) => o.value !== "ONLINE_MP" || form.mercadoPagoAvailable);
  const trocoCents = form.cashTenderedCents - totalCents;

  return (
    <View className="gap-2 rounded-2xl bg-card p-4 shadow-sm">
      <Text className="text-sm font-medium text-navy">Forma de pagamento</Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = form.paymentMethod === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => form.setPaymentMethod(option.value)}
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
                active ? "bg-navy" : "bg-navy/5"
              }`}
            >
              <Ionicons name={option.icon} size={14} color={active ? "#fff" : "#0b1e3d80"} />
              <Text className={`text-xs font-medium ${active ? "text-white" : "text-navy/70"}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!form.mercadoPagoAvailable && (
        <Text className="text-xs text-navy/50">
          Pagamento online ainda não está disponível — o pedido é registrado e confirmado
          direto com a farmácia.
        </Text>
      )}

      {form.paymentMethod === "DINHEIRO" && (
        <View className="mt-1 gap-1">
          <Text className="text-xs text-navy/60">Vai pagar com quanto?</Text>
          <TextInput
            value={form.cashInput}
            onChangeText={form.setCashInput}
            placeholder="0,00"
            keyboardType="decimal-pad"
            className="rounded-xl border border-navy/10 p-3"
          />
          {form.cashTenderedCents > 0 && (
            <Text className={`text-xs font-medium ${trocoCents >= 0 ? "text-mint" : "text-coral"}`}>
              {trocoCents >= 0
                ? `Troco: ${formatPrice(trocoCents)}`
                : `Faltam ${formatPrice(-trocoCents)} pro total do pedido`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
