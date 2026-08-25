/**
 * Centavos (unidade interna, sempre inteira) → reais (unidade que APIs
 * externas como Trier e Mercado Pago esperam). Extraído de trier.ts pra
 * ser reaproveitado por lib/orders/mercadopago.ts sem duplicar.
 */
export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}
