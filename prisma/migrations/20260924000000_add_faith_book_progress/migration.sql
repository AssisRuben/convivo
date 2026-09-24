-- Gotas de Fé passa a ter mais de um livro (Provérbios, Evangelho de
-- Marcos) com progresso/streak independente por livro. Progresso já
-- existente vira do livro "proverbios" (o único que existia até agora).
--
-- O DO block acha e derruba a constraint UNIQUE(userId) sozinho, em vez
-- de assumir o nome — essa tabela foi criada fora do fluxo normal de
-- migrations deste repo (sem arquivo correspondente em prisma/migrations
-- nem seção em seed_dev.sql), então não dá pra confiar no nome padrão do
-- Prisma sem confirmar contra o banco real.
DO $$
DECLARE
  found_constraint text;
BEGIN
  SELECT conname INTO found_constraint
  FROM pg_constraint
  WHERE conrelid = '"FaithProgress"'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (
      SELECT attnum FROM pg_attribute
      WHERE attrelid = '"FaithProgress"'::regclass AND attname = 'userId'
    );
  IF found_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "FaithProgress" DROP CONSTRAINT ' || quote_ident(found_constraint);
  END IF;
END $$;

ALTER TABLE "FaithProgress" ADD COLUMN "bookSlug" TEXT NOT NULL DEFAULT 'proverbios';
ALTER TABLE "FaithProgress" ALTER COLUMN "bookSlug" DROP DEFAULT;

CREATE UNIQUE INDEX "FaithProgress_userId_bookSlug_key" ON "FaithProgress"("userId", "bookSlug");
