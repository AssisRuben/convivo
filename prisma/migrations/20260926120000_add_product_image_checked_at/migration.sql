-- Marca quando a rotina de imagens tentou achar foto pro produto, pra
-- espaçar novas tentativas (ver lib/catalog/imageBackfill.ts). Só adiciona
-- coluna nula.
ALTER TABLE "Product" ADD COLUMN "imageCheckedAt" TIMESTAMP(3);
