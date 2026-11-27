-- Push: o que cada aparelho sabe fazer (capabilities) e os tickets
-- aguardando recibo de entrega da Expo. Só acrescenta.
ALTER TABLE "ExpoPushToken" ADD COLUMN "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "PushTicket" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PushTicket_createdAt_idx" ON "PushTicket"("createdAt");
