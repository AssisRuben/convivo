-- Duração do tratamento (05/10/2026): null = uso contínuo. Coluna nova e
-- nula — fichas que já existem continuam como uso contínuo, sem mudança de
-- comportamento.
ALTER TABLE "MedicationTracking" ADD COLUMN "treatmentDays" INTEGER;
