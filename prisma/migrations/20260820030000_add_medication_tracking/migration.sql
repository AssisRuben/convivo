-- Controle de uso de medicamentos: ficha por compra (quantidade/posologia),
-- um CareChecklistItem por horário de dose (reaproveita toda a engine de
-- checklist/streak já existente), aviso único de "vai acabar" e tokens de
-- push do Expo (o PushSubscription antigo é formato web-push, nunca usado,
-- e fica intocado).
CREATE TABLE "MedicationTracking" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "productName"   TEXT NOT NULL,
  "codigoProduto" INTEGER,
  "purchaseDate"  TIMESTAMP(3) NOT NULL,
  "totalUnits"    INTEGER NOT NULL,
  "unitsPerDose"  INTEGER NOT NULL,
  "active"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MedicationTracking_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicationTracking"
  ADD CONSTRAINT "MedicationTracking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "MedicationTracking_userId_idx" ON "MedicationTracking"("userId");

CREATE TABLE "MedicationRepurchaseAlert" (
  "id"                   TEXT NOT NULL,
  "medicationTrackingId" TEXT NOT NULL,
  "sentAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MedicationRepurchaseAlert_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicationRepurchaseAlert"
  ADD CONSTRAINT "MedicationRepurchaseAlert_medicationTrackingId_fkey"
  FOREIGN KEY ("medicationTrackingId") REFERENCES "MedicationTracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "MedicationRepurchaseAlert_medicationTrackingId_key"
  ON "MedicationRepurchaseAlert"("medicationTrackingId");

CREATE TABLE "ExpoPushToken" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExpoPushToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpoPushToken_token_key" ON "ExpoPushToken"("token");

ALTER TABLE "ExpoPushToken"
  ADD CONSTRAINT "ExpoPushToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CareChecklistItem" ADD COLUMN "medicationTrackingId" TEXT;

ALTER TABLE "CareChecklistItem"
  ADD CONSTRAINT "CareChecklistItem_medicationTrackingId_fkey"
  FOREIGN KEY ("medicationTrackingId") REFERENCES "MedicationTracking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
