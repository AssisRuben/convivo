-- Métodos de pagamento reais: Mercado Pago online (Checkout Pro),
-- cartão presencial e dinheiro (com troco). mpPaymentId (já existia,
-- nunca usado) passa a ser preenchido de verdade pelo webhook do MP.
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE_MP', 'CARTAO_PRESENCIAL', 'DINHEIRO');

ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CARTAO_PRESENCIAL';
ALTER TABLE "Order" ADD COLUMN "cashTenderedCents" INTEGER;
ALTER TABLE "Order" ADD COLUMN "mpPreferenceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpError" TEXT;

CREATE INDEX "Order_mpPreferenceId_idx" ON "Order"("mpPreferenceId");
