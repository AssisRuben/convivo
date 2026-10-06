-- Pontos de cuidado (ver model CarePointsEntry). Só acrescenta.
ALTER TYPE "WalletEntrySource" ADD VALUE IF NOT EXISTS 'CARE_POINTS';

CREATE TABLE "CarePointsEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarePointsEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CarePointsEntry_userId_refKey_key" ON "CarePointsEntry"("userId", "refKey");
CREATE INDEX "CarePointsEntry_userId_createdAt_idx" ON "CarePointsEntry"("userId", "createdAt");

ALTER TABLE "CarePointsEntry" ADD CONSTRAINT "CarePointsEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
