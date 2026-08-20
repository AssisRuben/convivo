-- Cartão fidelidade: 1 selo por pedido aprovado >= R$50; ao completar 10,
-- credita R$50 de saldo na carteira (mesmo mecanismo da comissão de
-- indicação). LoyaltyStampCycle é a idempotência (igual
-- CareChecklistCompletion/CareReminderDispatch) — evita creditar o mesmo
-- ciclo duas vezes se approveOrder for chamado de novo (retry de webhook).
ALTER TYPE "WalletEntrySource" ADD VALUE 'LOYALTY_STAMP_REWARD';

CREATE TABLE "LoyaltyStampCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "rewardCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyStampCycle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoyaltyStampCycle_userId_cycleNumber_key" ON "LoyaltyStampCycle"("userId", "cycleNumber");

ALTER TABLE "LoyaltyStampCycle" ADD CONSTRAINT "LoyaltyStampCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
