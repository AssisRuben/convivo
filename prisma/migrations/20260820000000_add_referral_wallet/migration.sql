-- Bônus/comissão de indicação: extrato de crédito (WalletEntry) e a meta
-- em escada de "amigos indicados" (GoalType.INDICACAO), pra evoluir o
-- bichinho e postar em "Minhas postagens" igual peso/rotina já fazem.
ALTER TYPE "TimelineEventType" ADD VALUE 'ACHIEVEMENT_REFERRAL_MILESTONE';

ALTER TYPE "GoalType" ADD VALUE 'INDICACAO';

CREATE TYPE "WalletEntrySource" AS ENUM ('REFERRAL_SIGNUP');

CREATE TABLE "WalletEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "source" "WalletEntrySource" NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WalletEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WalletEntry"
  ADD CONSTRAINT "WalletEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "WalletEntry_userId_idx" ON "WalletEntry"("userId");
