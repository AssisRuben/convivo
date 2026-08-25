import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CheckoutFormState } from "@/hooks/useCheckoutForm";

/**
 * Bloco de retirada/entrega + endereço — extraído de recomprar.tsx, que
 * era o único lugar que tinha isso; agora reaproveitado também pelo
 * carrinho principal, que não tinha nada disso antes.
 */
export function FulfillmentAddressForm({ form }: { form: CheckoutFormState }) {
  return (
    <>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => form.setFulfillmentType("PICKUP")}
          className={`flex-1 items-center rounded-xl py-3 ${
            form.fulfillmentType === "PICKUP" ? "bg-navy" : "bg-navy/5"
          }`}
        >
          <Text
            className={form.fulfillmentType === "PICKUP" ? "font-semibold text-white" : "text-navy/70"}
          >
            Retirar na loja
          </Text>
        </Pressable>
        <Pressable
          onPress={() => form.setFulfillmentType("DELIVERY")}
          className={`flex-1 items-center rounded-xl py-3 ${
            form.fulfillmentType === "DELIVERY" ? "bg-navy" : "bg-navy/5"
          }`}
        >
          <Text
            className={form.fulfillmentType === "DELIVERY" ? "font-semibold text-white" : "text-navy/70"}
          >
            Entrega
          </Text>
        </Pressable>
      </View>

      {form.fulfillmentType === "DELIVERY" && (
        <View className="gap-2 rounded-2xl bg-card p-4 shadow-sm">
          <Text className="text-sm font-medium text-navy">Endereço de entrega</Text>

          {form.pharmacyAddressNotice && (
            <View className="flex-row items-start gap-2 rounded-xl bg-mint/10 p-3">
              <Ionicons name="information-circle-outline" size={16} color="#2ec4b6" />
              <Text className="flex-1 text-xs text-navy/70">
                Preenchemos com o endereço do seu cadastro na farmácia — confira se está certo.
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-2">
            <TextInput
              value={form.cep}
              onChangeText={form.handleCepChange}
              placeholder="CEP"
              keyboardType="numeric"
              maxLength={9}
              className="flex-1 rounded-xl border border-navy/10 p-3"
            />
            {form.cepLookupLoading && <ActivityIndicator size="small" color="#0b1e3d" />}
          </View>
          <TextInput
            value={form.logradouro}
            onChangeText={form.setLogradouro}
            placeholder="Rua"
            className="rounded-xl border border-navy/10 p-3"
          />
          <View className="flex-row gap-2">
            <TextInput
              value={form.numero}
              onChangeText={form.setNumero}
              placeholder="Número"
              className="flex-1 rounded-xl border border-navy/10 p-3"
            />
            <TextInput
              value={form.bairro}
              onChangeText={form.setBairro}
              placeholder="Bairro"
              className="flex-1 rounded-xl border border-navy/10 p-3"
            />
          </View>
          <View className="flex-row gap-2">
            <TextInput
              value={form.cidade}
              onChangeText={form.setCidade}
              placeholder="Cidade"
              className="flex-1 rounded-xl border border-navy/10 p-3"
            />
            <TextInput
              value={form.estado}
              onChangeText={(text) => form.setEstado(text.toUpperCase())}
              placeholder="UF"
              maxLength={2}
              autoCapitalize="characters"
              className="w-16 rounded-xl border border-navy/10 p-3"
            />
          </View>
        </View>
      )}
    </>
  );
}
