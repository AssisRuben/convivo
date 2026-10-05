-- Conteúdo de leitura (tópicos de Pílulas + livros de Gotas de Fé) sai de
-- src/constants/*.ts e vira dado (05/10/2026). Carga inicial:
-- scripts/seed-reading-content.ts.
-- CreateEnum
CREATE TYPE "ReadingKind" AS ENUM ('WISDOM', 'FAITH');

-- CreateTable
CREATE TABLE "ReadingBook" (
    "slug" TEXT NOT NULL,
    "kind" "ReadingKind" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingBook_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "ReadingChapter" (
    "id" TEXT NOT NULL,
    "bookSlug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingChapter_bookSlug_number_key" ON "ReadingChapter"("bookSlug", "number");

-- AddForeignKey
ALTER TABLE "ReadingChapter" ADD CONSTRAINT "ReadingChapter_bookSlug_fkey" FOREIGN KEY ("bookSlug") REFERENCES "ReadingBook"("slug") ON DELETE CASCADE ON UPDATE CASCADE;


-- Mesmo padrão das outras tabelas: RLS ligada e sem policy = a API
-- pública do Supabase (anon/authenticated) não lê nem grava; o servidor
-- (Prisma, conexão postgres) continua acessando normalmente.
ALTER TABLE "ReadingBook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadingChapter" ENABLE ROW LEVEL SECURITY;
