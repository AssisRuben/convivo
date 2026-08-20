-- Checkout mínimo: custo do produto (pra calcular margem) e a fonte de
-- comissão recorrente por compra do indicado.
ALTER TABLE "Product" ADD COLUMN "costCents" INTEGER;

ALTER TYPE "WalletEntrySource" ADD VALUE 'REFERRAL_PURCHASE_COMMISSION';
