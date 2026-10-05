-- Histórico da agenda (daysOfWeek) dos cuidados da Rotina, pra meta de
-- Rotina calcular o progresso com os dias que valiam em cada período.
-- Só acrescenta tabela — itens existentes ficam sem histórico, o que
-- significa "agenda atual vale desde sempre" (mesmo comportamento de antes).
CREATE TABLE "CareScheduleVersion" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareScheduleVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareScheduleVersion_itemId_effectiveFrom_key" ON "CareScheduleVersion"("itemId", "effectiveFrom");

ALTER TABLE "CareScheduleVersion" ADD CONSTRAINT "CareScheduleVersion_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "CareChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
