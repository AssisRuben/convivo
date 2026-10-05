/**
 * Versão manual da rotina de fotos do catálogo (a automática é o n8n
 * chamando /api/cron/backfill-product-images). Mesma lógica, em
 * lib/catalog/imageBackfill.ts. Re-execução é segura: só toca produto
 * ainda sem foto.
 *
 * Uso: npm run backfill:images -- --limit=200
 *
 * Roda via `tsx --env-file=.env.local` (não dotenv) porque @/lib/prisma lê
 * DATABASE_URL no top-level do módulo — imports estáticos são hoisted.
 */
import { prisma } from "../src/lib/prisma";
import { backfillProductImages } from "../src/lib/catalog/imageBackfill";

const DELAY_BETWEEN_LOOKUPS_MS = 4000;
const DEFAULT_LIMIT = 55; // mesmo teto da cota diária + tolerância da Kodebar

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : DEFAULT_LIMIT;

  const result = await backfillProductImages({ limit, delayMs: DELAY_BETWEEN_LOOKUPS_MS, log: console.log });
  console.log(`\n${result.resolved}/${result.processed} resolvidas nesta execução. Restam ${result.pending} na fila.`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
