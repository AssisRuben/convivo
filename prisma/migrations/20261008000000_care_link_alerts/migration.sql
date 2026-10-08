-- Modo cuidador: validade do convite e registro de alertas enviados (ver
-- CareLink / CaregiverAlertDispatch). Só acrescenta.
ALTER TABLE "CareLink" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE TABLE "CaregiverAlertDispatch" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaregiverAlertDispatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaregiverAlertDispatch_linkId_itemId_date_key" ON "CaregiverAlertDispatch"("linkId", "itemId", "date");
ALTER TABLE "CaregiverAlertDispatch" ADD CONSTRAINT "CaregiverAlertDispatch_linkId_fkey"
    FOREIGN KEY ("linkId") REFERENCES "CareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
