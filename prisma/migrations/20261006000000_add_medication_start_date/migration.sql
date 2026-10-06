-- "Comecei a tomar em" (ver MedicationTracking.startDate). Fichas que já
-- existem ficam com o dia em que foram cadastradas no app (horário de
-- Brasília), não com a data da compra — é o caso do feedback "cadastrei
-- hoje e já aparece que acabou".
ALTER TABLE "MedicationTracking" ADD COLUMN "startDate" DATE;

UPDATE "MedicationTracking"
SET "startDate" = ("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
WHERE "startDate" IS NULL;
