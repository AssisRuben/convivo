import { useCallback, useState } from "react";
import { apiFetch, type ApiProfile } from "@/lib/api";

export type CheckoutPaymentMethod = "ONLINE_MP" | "CARTAO_PRESENCIAL" | "DINHEIRO";
export type CheckoutFulfillmentType = "PICKUP" | "DELIVERY";

/** "12,50" ou "12.50" → 1250. Entrada inválida/vazia vira 0. */
function parseReaisToCents(text: string): number {
  const normalized = text.replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0;
}

/**
 * Estado compartilhado do formulário de checkout (entrega/endereço + forma
 * de pagamento) — usado tanto pelo carrinho quanto pela recompra de
 * medicamento, os dois únicos pontos que criam pedido. Só possui o estado
 * do formulário; busca de dados (perfil, disponibilidade do Mercado Pago)
 * continua em cada tela, igual já era antes dessa extração.
 */
export function useCheckoutForm() {
  const [fulfillmentType, setFulfillmentType] = useState<CheckoutFulfillmentType>("PICKUP");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("CARTAO_PRESENCIAL");
  const [cashInput, setCashInput] = useState("");
  const [mercadoPagoAvailable, setMercadoPagoAvailable] = useState(false);

  const applyProfileDefaults = useCallback((profile: ApiProfile) => {
    setCep(profile.cep ?? "");
    setLogradouro(profile.logradouro ?? "");
    setNumero(profile.numero ?? "");
    setBairro(profile.bairro ?? "");
    setCidade(profile.cidade ?? "");
    setEstado(profile.estado ?? "");
  }, []);

  const loadMercadoPagoAvailability = useCallback(async () => {
    const res = await apiFetch("/api/mobile/pedidos/payment-methods");
    if (res.ok) {
      const data = await res.json();
      setMercadoPagoAvailable(Boolean(data.mercadoPagoAvailable));
    }
  }, []);

  const cashTenderedCents = parseReaisToCents(cashInput);

  function validate(totalCents: number): string | null {
    if (fulfillmentType === "DELIVERY") {
      const missing = !cep.trim() || !logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim();
      if (missing) return "Preencha o endereço de entrega";
    }
    if (paymentMethod === "DINHEIRO" && cashTenderedCents < totalCents) {
      return "Informe um valor em dinheiro maior ou igual ao total do pedido";
    }
    return null;
  }

  function toRequestBody(walletDiscountCents: number) {
    return {
      fulfillmentType,
      address:
        fulfillmentType === "DELIVERY" ? { cep, logradouro, numero, bairro, cidade, estado } : undefined,
      walletDiscountCents,
      paymentMethod,
      cashTenderedCents: paymentMethod === "DINHEIRO" ? cashTenderedCents : undefined,
    };
  }

  return {
    fulfillmentType,
    setFulfillmentType,
    cep,
    setCep,
    logradouro,
    setLogradouro,
    numero,
    setNumero,
    bairro,
    setBairro,
    cidade,
    setCidade,
    estado,
    setEstado,
    paymentMethod,
    setPaymentMethod,
    cashInput,
    setCashInput,
    cashTenderedCents,
    mercadoPagoAvailable,
    applyProfileDefaults,
    loadMercadoPagoAvailability,
    validate,
    toRequestBody,
  };
}

export type CheckoutFormState = ReturnType<typeof useCheckoutForm>;
