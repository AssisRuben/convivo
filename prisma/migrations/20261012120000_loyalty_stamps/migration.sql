-- Cartão fidelidade conta qualquer compra (app ou loja): um selo por
-- compra em LoyaltyStamp. Só acrescenta; os pedidos do app que já valiam
-- selo entram aqui pra contagem continuar igual.
CREATE TYPE "LoyaltyStampSource" AS ENUM ('APP', 'LOJA');

ALTER TABLE "User" ADD COLUMN "loyaltySyncedAt" TIMESTAMP(3);

CREATE TABLE "LoyaltyStamp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "LoyaltyStampSource" NOT NULL,
    "refKey" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "purchasedAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyStamp_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LoyaltyStamp_refKey_key" ON "LoyaltyStamp"("refKey");
CREATE INDEX "LoyaltyStamp_userId_idx" ON "LoyaltyStamp"("userId");
ALTER TABLE "LoyaltyStamp" ADD CONSTRAINT "LoyaltyStamp_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Pedidos do app que já contavam (aprovados, itens >= R$ 50).
INSERT INTO "LoyaltyStamp" ("id", "userId", "source", "refKey", "amountCents", "purchasedAt")
SELECT 'ls_' || o."id", o."userId", 'APP', 'order:' || o."id", o."subtotalCents", o."createdAt"::date
FROM "Order" o
WHERE o."status" = 'APPROVED' AND o."subtotalCents" >= 5000;
