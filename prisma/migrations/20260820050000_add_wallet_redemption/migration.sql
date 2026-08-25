-- Resgate de saldo da carteira como desconto no checkout. subtotalCents
-- guarda o valor bruto dos itens (pré-desconto) — necessário pro cartão
-- fidelidade continuar qualificando pedidos pelo valor da compra em si,
-- não pelo valor efetivamente cobrado após desconto (ver
-- checkLoyaltyStampReward em loyaltyCore.ts). totalCents continua
-- significando "valor cobrado do cliente" — o que é reportado pra Trier
-- em valorTotalCents, sem precisar mexer em trier.ts.
ALTER TABLE "Order" ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "walletDiscountCents" INTEGER NOT NULL DEFAULT 0;

-- Backfill: pedidos existentes nunca tiveram desconto, então subtotalCents
-- == totalCents pra todo o histórico.
UPDATE "Order" SET "subtotalCents" = "totalCents";

ALTER TYPE "WalletEntrySource" ADD VALUE 'WALLET_REDEMPTION';
