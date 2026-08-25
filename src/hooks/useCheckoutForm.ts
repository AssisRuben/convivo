import { useCallback, useRef, useState } from "react";
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
 * Só a cidade — a farmácia (`clientes`) não tem nome de cidade em texto,
 * só um código sem tabela de apoio confirmada. Reaproveita o ViaCEP, mesmo
 * caminho já usado pro CEP digitado à mão. Nunca lança.
 */
function lookupCidadeFromCep(cepDigits: string): Promise<string | null> {
  return fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
    .then((res) => res.json())
    .then((data) => (data?.erro ? null : (data.localidade as string) || null))
    .catch(() => null);
}

/**
 * Estado compartilhado do formulário de checkout (entrega/endereço + forma
 * de pagamento) — usado tanto pelo carrinho quanto pela recompra de
 * medicamento, os dois únicos pontos que criam pedido. Só possui o estado
 * do formulário; busca de dados (perfil, disponibilidade do Mercado Pago)
 * continua em cada tela, igual já era antes dessa extração.
 */
export function useCheckoutForm() {
  const [fulfillmentType, setFulfillmentTypeRaw] = useState<CheckoutFulfillmentType>("PICKUP");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("CARTAO_PRESENCIAL");
  const [cashInput, setCashInput] = useState("");
  const [mercadoPagoAvailable, setMercadoPagoAvailable] = useState(false);
  const [cepLookupLoading, setCepLookupLoading] = useState(false);
  const [pharmacyAddressNotice, setPharmacyAddressNotice] = useState(false);
  const pharmacyLookupAttempted = useRef(false);

  /**
   * Mascara "00000-000" enquanto digita e, com os 8 dígitos completos,
   * busca o endereço no ViaCEP (gratuito, sem chave, mantido pelos Correios
   * via terceiro) pra preencher rua/bairro/cidade/UF sozinho — número
   * continua manual, já que o CEP não sabe qual casa/apê é. Nunca lança:
   * CEP inválido ou API fora do ar só deixa os campos como estavam, pro
   * usuário preencher na mão.
   */
  const handleCepChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    setCep(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);

    if (digits.length !== 8) return;
    setCepLookupLoading(true);
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.erro) return;
        setLogradouro(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      })
      .catch(() => {})
      .finally(() => setCepLookupLoading(false));
  }, []);

  const applyProfileDefaults = useCallback((profile: ApiProfile) => {
    setCep(profile.cep ?? "");
    setLogradouro(profile.logradouro ?? "");
    setNumero(profile.numero ?? "");
    setBairro(profile.bairro ?? "");
    setCidade(profile.cidade ?? "");
    setEstado(profile.estado ?? "");
  }, []);

  /**
   * Na primeira vez que o usuário escolhe "Entrega" sem endereço nenhum
   * preenchido (perfil do Convivo não salva endereço vindo do checkout —
   * só o pedido guarda o que foi usado naquela compra, ver orderCore.ts),
   * busca o endereço já cadastrado na farmácia e preenche os campos.
   * Continuam editáveis e o pedido só sai com o que estiver na tela — nunca
   * confia demais nisso, só evita repetir digitação de quem já é cliente.
   */
  const setFulfillmentType = useCallback(
    (type: CheckoutFulfillmentType) => {
      setFulfillmentTypeRaw(type);
      if (type !== "DELIVERY" || pharmacyLookupAttempted.current) return;
      if (cep.trim() || logradouro.trim() || bairro.trim() || estado.trim()) return;

      pharmacyLookupAttempted.current = true;
      apiFetch("/api/mobile/profile/pharmacy-address")
        .then((res) => res.json())
        .then((data) => {
          const address = data?.address;
          if (!address?.cep) return;

          const digits = String(address.cep).replace(/\D/g, "").slice(0, 8);
          setCep(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
          if (address.logradouro) setLogradouro(address.logradouro);
          if (address.numero) setNumero(address.numero);
          if (address.bairro) setBairro(address.bairro);
          if (address.estado) setEstado(address.estado);
          setPharmacyAddressNotice(true);

          if (digits.length === 8) {
            lookupCidadeFromCep(digits).then((foundCidade) => {
              if (foundCidade) setCidade(foundCidade);
            });
          }
        })
        .catch(() => {});
    },
    [cep, logradouro, bairro, estado]
  );

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
    handleCepChange,
    cepLookupLoading,
    pharmacyAddressNotice,
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
