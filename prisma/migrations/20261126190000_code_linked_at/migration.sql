-- Data do vínculo do código (amigo/vendedor) — comissão das compras da loja
-- só conta a partir daqui. Null nos vínculos antigos = vale desde o cadastro.
ALTER TABLE "User" ADD COLUMN "codeLinkedAt" TIMESTAMP(3);
