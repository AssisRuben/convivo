-- Product vira espelho "write-through" do catálogo real da farmácia (banco
-- externo, ver src/lib/catalog/catalogDb.ts) em vez de tabela curada à
-- mão. name deixa de ser único (nome de origem não garante isso),
-- description vira opcional (sem coluna equivalente na origem), category
-- deixa de ser o enum fixo MEDICAMENTO/PRODUTO e vira texto livre (slug
-- mapeado em código a partir do "grupo" de origem, ver
-- constants/catalogCategories.ts).
DROP INDEX "Product_name_key";

ALTER TABLE "Product" ALTER COLUMN "description" DROP NOT NULL;

ALTER TABLE "Product" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "Product" ALTER COLUMN "category" DROP NOT NULL;

DROP TYPE "ProductCategory";
