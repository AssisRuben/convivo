-- Uso dos créditos no balcão: papel de atendente, código de resgate,
-- registro dos resgates e vencimento do crédito (12 meses). Só acrescenta.
ALTER TYPE "WalletEntrySource" ADD VALUE IF NOT EXISTS 'WALLET_EXPIRATION';

ALTER TABLE "User" ADD COLUMN "isAtendente" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "WalletEntry" ADD COLUMN "refKey" TEXT;
CREATE UNIQUE INDEX "WalletEntry_refKey_key" ON "WalletEntry"("refKey");

CREATE TABLE "WalletRedeemCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletRedeemCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletRedeemCode_code_key" ON "WalletRedeemCode"("code");
CREATE INDEX "WalletRedeemCode_userId_idx" ON "WalletRedeemCode"("userId");
ALTER TABLE "WalletRedeemCode" ADD CONSTRAINT "WalletRedeemCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WalletRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "purchaseCents" INTEGER NOT NULL,
    "saleNumber" TEXT,
    "walletEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),
    "reversedById" TEXT,

    CONSTRAINT "WalletRedemption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletRedemption_walletEntryId_key" ON "WalletRedemption"("walletEntryId");
CREATE INDEX "WalletRedemption_createdAt_idx" ON "WalletRedemption"("createdAt");
ALTER TABLE "WalletRedemption" ADD CONSTRAINT "WalletRedemption_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WalletRedemption" ADD CONSTRAINT "WalletRedemption_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
