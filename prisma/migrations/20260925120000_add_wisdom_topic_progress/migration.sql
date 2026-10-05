-- Pílulas de sabedoria vira "hub de tópicos" com progresso/streak
-- independente por tópico, igual Gotas de Fé (ver add_faith_book_progress
-- e fix_faith_progress_user_unique — mesma lição aplicada aqui direto,
-- sem precisar de uma segunda migration de correção). Tópicos e faixas de
-- capítulo do trail antigo (constants/wisdomPills.ts, WISDOM_TOPICS antes
-- do split): decisoes-vieses 1-8, estoicismo 9-15, odisseia 16-25.

-- 1) Índice UNIQUE(userId) antigo — o Prisma cria @unique como índice
-- único, que não aparece em pg_constraint (só em pg_index).
DO $$
DECLARE
  idx text;
BEGIN
  FOR idx IN
    SELECT i.relname
    FROM pg_index x
    JOIN pg_class i ON i.oid = x.indexrelid
    WHERE x.indrelid = '"WisdomProgress"'::regclass
      AND x.indisunique
      AND NOT x.indisprimary
      AND x.indnatts = 1
      AND x.indkey[0] = (
        SELECT attnum FROM pg_attribute
        WHERE attrelid = '"WisdomProgress"'::regclass AND attname = 'userId'
      )
  LOOP
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = idx) THEN
      EXECUTE 'ALTER TABLE "WisdomProgress" DROP CONSTRAINT ' || quote_ident(idx);
    ELSE
      EXECUTE 'DROP INDEX ' || quote_ident(idx);
    END IF;
  END LOOP;
END $$;

ALTER TABLE "WisdomProgress" ADD COLUMN "topicSlug" TEXT;

-- 2) Progresso existente era uma trilha única (chaptersRead 0-25) — split
-- pros tópicos que ela cruza. Quem não passou de 8 capítulos cabe inteiro
-- no primeiro tópico (um UPDATE só); quem passou gera uma linha extra por
-- tópico adicional que tiver alcançado.
DO $$
DECLARE
  progress_row RECORD;
  topic RECORD;
  remaining INT;
  topic_total INT;
  chapters_here INT;
  is_first_topic BOOLEAN;
BEGIN
  FOR progress_row IN SELECT * FROM "WisdomProgress" WHERE "topicSlug" IS NULL LOOP
    remaining := progress_row."chaptersRead";
    is_first_topic := true;
    FOR topic IN
      SELECT * FROM (VALUES
        ('decisoes-vieses', 1, 8),
        ('estoicismo', 9, 15),
        ('odisseia', 16, 25)
      ) AS t(slug, first_chapter, last_chapter)
      ORDER BY first_chapter
    LOOP
      EXIT WHEN remaining <= 0 AND NOT is_first_topic;

      topic_total := topic.last_chapter - topic.first_chapter + 1;
      chapters_here := GREATEST(0, LEAST(remaining, topic_total));

      IF is_first_topic THEN
        -- A linha original vira o primeiro tópico (mesma linha, mesmo id).
        UPDATE "WisdomProgress"
        SET "topicSlug" = topic.slug,
            "chaptersRead" = chapters_here,
            "lastReadDate" = CASE WHEN chapters_here < remaining THEN progress_row."lastReadDate" ELSE progress_row."lastReadDate" END
        WHERE id = progress_row.id;
        is_first_topic := false;
      ELSIF chapters_here > 0 THEN
        INSERT INTO "WisdomProgress"
          (id, "userId", "topicSlug", "chaptersRead", "streakDays", "lastReadDate", "lastNotifiedDate", "updatedAt")
        VALUES
          (
            'wp_' || progress_row."userId" || '_' || topic.slug,
            progress_row."userId",
            topic.slug,
            chapters_here,
            -- Streak é só do tópico em andamento — tópicos concluídos antes
            -- não têm como reconstruir a sequência de dias real, então
            -- ficam com 0 (não afeta o gate: chaptersRead >= total já
            -- bloqueia o próximo capítulo independente do streak).
            CASE WHEN chapters_here = topic_total AND remaining > topic_total THEN 0 ELSE progress_row."streakDays" END,
            progress_row."lastReadDate",
            NULL,
            now()
          );
      END IF;

      remaining := remaining - chapters_here;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE "WisdomProgress" ALTER COLUMN "topicSlug" SET NOT NULL;
CREATE UNIQUE INDEX "WisdomProgress_userId_topicSlug_key" ON "WisdomProgress"("userId", "topicSlug");
