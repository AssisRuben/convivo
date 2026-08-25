-- Comissão de vendedor (5% da margem), coexistindo com a comissão de
-- indicação entre amigos (2%) — um cliente pode ter os dois vínculos ao
-- mesmo tempo, cada um credita separado (ver orderCore.ts). O campo
-- "vendedorAttributed", que nunca chegou a ser usado em código nenhum,
-- sai; vendedorId (nulo ou não) já é a fonte da verdade sobre o vínculo.
ALTER TABLE "User" DROP COLUMN "vendedorAttributed";

ALTER TABLE "User" ADD COLUMN "isVendedor" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "vendedorId" TEXT;

ALTER TABLE "User"
  ADD CONSTRAINT "User_vendedorId_fkey"
  FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "WalletEntrySource" ADD VALUE 'VENDEDOR_PURCHASE_COMMISSION';
