// Integração com o Mercado Pago (Checkout Pro) — espelha o padrão de
// degradação graciosa da Trier (trier.ts): sem as variáveis de ambiente
// configuradas, isMercadoPagoConfigured() retorna false e o resto do app
// trata isso como "pagamento online indisponível", nunca lança erro.
//
// APP_PUBLIC_BASE_URL é exigida além do token de acesso porque a
// preferência precisa de uma notification_url e back_urls públicas em
// HTTPS — sem hospedagem pública configurada (nenhuma nesta sessão de
// dev), não tem pra onde o Mercado Pago chamar de volta, então tratar
// como "não configurado" é honesto, não um bug.
import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  Preference,
  WebhookSignatureValidator,
} from "mercadopago";
import { centsToReais } from "@/lib/money";

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.APP_PUBLIC_BASE_URL);
}

function getConfig(): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 5000 },
  });
}

export type MpPreferenceOrder = {
  id: string;
  totalCents: number;
  user: { name: string; email: string };
};

export type CreatePreferenceResult =
  | { ok: true; checkoutUrl: string; preferenceId: string }
  | { ok: false; error: string };

/**
 * Cria a preferência de checkout (Checkout Pro) pro pedido — nunca lança,
 * sempre devolve um resultado explícito. `external_reference` é o id do
 * pedido: é assim que o webhook, mais tarde, sabe qual pedido aprovar.
 */
export async function createPreferenceForOrder(
  order: MpPreferenceOrder
): Promise<CreatePreferenceResult> {
  const baseUrl = process.env.APP_PUBLIC_BASE_URL;
  if (!isMercadoPagoConfigured() || !baseUrl) {
    return { ok: false, error: "Mercado Pago não configurado" };
  }

  try {
    const preference = new Preference(getConfig());
    const response = await preference.create({
      body: {
        items: [
          {
            id: order.id,
            title: `Pedido Convivo #${order.id.slice(-8)}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: centsToReais(order.totalCents),
          },
        ],
        external_reference: order.id,
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        back_urls: {
          success: `${baseUrl}/checkout/retorno?order=${order.id}`,
          pending: `${baseUrl}/checkout/retorno?order=${order.id}`,
          failure: `${baseUrl}/checkout/retorno?order=${order.id}`,
        },
        auto_return: "approved",
        payer: { name: order.user.name, email: order.user.email },
      },
    });

    if (!response.id || !response.init_point) {
      return { ok: false, error: "Mercado Pago não retornou uma URL de checkout" };
    }
    return { ok: true, checkoutUrl: response.init_point, preferenceId: response.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Confere a assinatura do webhook (header x-signature) contra
 * MP_WEBHOOK_SECRET — usa o validador que já vem no próprio SDK em vez de
 * reimplementar o HMAC na mão. É essa checagem que autentica a chamada
 * (o webhook não usa Bearer token como o resto das rotas mobile).
 */
export function verifyWebhookSignature(
  headers: Headers,
  dataId: string,
  requestId: string | null
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  try {
    WebhookSignatureValidator.validate({
      xSignature: headers.get("x-signature"),
      xRequestId: requestId,
      dataId,
      secret,
      toleranceSeconds: 300,
    });
    return true;
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return false;
    throw error;
  }
}

export type MpPaymentStatus = { status: string; externalReference: string | null };

/**
 * Busca o status de verdade na API do MP — nunca confia no que o corpo do
 * webhook diz sobre o pagamento, só no que a própria API do MP responde
 * quando consultada com o id recebido na notificação.
 */
export async function fetchPaymentStatus(paymentId: string): Promise<MpPaymentStatus> {
  const payment = new Payment(getConfig());
  const response = await payment.get({ id: paymentId });
  return {
    status: response.status ?? "unknown",
    externalReference: response.external_reference ?? null,
  };
}

export type MpOrderAction = "approve" | "reject" | "none";

export function mapMpStatusToOrderAction(status: string): MpOrderAction {
  if (status === "approved") return "approve";
  if (status === "rejected" || status === "cancelled") return "reject";
  return "none";
}
