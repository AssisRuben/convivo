-- A migration anterior (add_faith_book_progress) só procurava a regra
-- UNIQUE(userId) em pg_constraint, mas o Prisma cria @unique como índice
-- único ("FaithProgress_userId_key"), que não aparece lá. O índice antigo
-- sobreviveu e bloqueia um segundo livro pro mesmo usuário
-- ("Unique constraint failed on the fields: (userId)").
DO $$
DECLARE
  idx text;
BEGIN
  FOR idx IN
    SELECT i.relname
    FROM pg_index x
    JOIN pg_class i ON i.oid = x.indexrelid
    WHERE x.indrelid = '"FaithProgress"'::regclass
      AND x.indisunique
      AND NOT x.indisprimary
      AND x.indnatts = 1
      AND x.indkey[0] = (
        SELECT attnum FROM pg_attribute
        WHERE attrelid = '"FaithProgress"'::regclass AND attname = 'userId'
      )
  LOOP
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = idx) THEN
      EXECUTE 'ALTER TABLE "FaithProgress" DROP CONSTRAINT ' || quote_ident(idx);
    ELSE
      EXECUTE 'DROP INDEX ' || quote_ident(idx);
    END IF;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "FaithProgress_userId_bookSlug_key" ON "FaithProgress"("userId", "bookSlug");
