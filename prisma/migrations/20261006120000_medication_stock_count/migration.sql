-- Estoque separado do tratamento e caixas separadas de comprimidos (ver
-- MedicationTracking.stockCountedAt / packQuantity).
ALTER TABLE "MedicationTracking" ADD COLUMN "stockCountedAt" DATE;
ALTER TABLE "MedicationTracking" ADD COLUMN "packQuantity" INTEGER NOT NULL DEFAULT 1;

-- A contagem existente valia desde o início do uso (regra anterior).
UPDATE "MedicationTracking"
SET "stockCountedAt" = COALESCE("startDate", "purchaseDate"::date)
WHERE "stockCountedAt" IS NULL;

-- Correção dos cadastros que vieram do histórico de compras com o NÚMERO
-- DE CAIXAS no lugar de comprimidos (ex.: "OMEGA 3 120CAP" com 1 → o app
-- achava que era 1 cápsula e mostrava "já deve ter acabado"). Só mexe
-- quando o nome traz a contagem por caixa e o valor salvo é pequeno o
-- bastante pra ser número de caixas (até 3): vira caixas × contagem, e
-- packQuantity guarda as caixas pra recompra.
UPDATE "MedicationTracking"
SET "packQuantity" = "totalUnits",
    "totalUnits" = "totalUnits" * (substring("productName" from '(\d+)\s*(?:CPR|COMP|CAPS|CAP|CP|DRG|UN)\M'))::int
WHERE active
  AND "codigoProduto" IS NOT NULL
  AND "totalUnits" <= 3
  AND substring("productName" from '(\d+)\s*(?:CPR|COMP|CAPS|CAP|CP|DRG|UN)\M') IS NOT NULL;
