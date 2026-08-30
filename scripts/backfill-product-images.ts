/**
 * Roda uma vez por dia (re-execução é segura: só toca produto ainda sem
 * foto). Popula Product.imageUrl pra itens do catálogo real que nunca
 * foram espelhados — resolve foto pela mesma cadeia de fontes usada em
 * tempo de request (mirrorCatalogProduct/productImage.ts), agora com a
 * Kodebar como primeira fonte. Respeita o rate limit de rajada da
 * Kodebar (não documentado, achado testando manualmente) com um
 * intervalo entre chamadas — sem isso a maior parte das consultas do dia
 * se perde em 429 à toa.
 *
 * Uso: npm run backfill:images -- --limit=200
 *
 * Precisa do env carregado ANTES de qualquer import que toque
 * `@/lib/prisma` (ele lê DATABASE_URL no top-level do módulo, na
 * primeira vez que for importado) — imports estáticos são hoisted, então
 * dotenv.config() aqui em cima não adianta. Por isso o script roda via
 * `tsx --env-file=.env.local`, não com dotenv.
 */
import { Pool } from "pg";
import { prisma } from "../src/lib/prisma";
import { mirrorCatalogProduct } from "../src/lib/catalog/catalogMirror";
import type { CatalogProduct } from "../src/lib/catalog/catalogDb";

const DELAY_BETWEEN_LOOKUPS_MS = 4000;
const DEFAULT_LIMIT = 55; // mesmo teto da cota diária + tolerância da Kodebar

type CatalogRow = {
  codigo: number;
  codigo_barras: string;
  nome: string;
  marca: string | null;
  grupo: string | null;
  preco_venda: string;
  custo_medio: string | null;
  estoque_atual: number;
};

function rowToCatalogProduct(row: CatalogRow): CatalogProduct {
  return {
    codigo: row.codigo,
    codigoBarras: row.codigo_barras,
    nome: row.nome,
    marca: row.marca,
    grupo: row.grupo,
    precoCents: Math.round(Number(row.preco_venda) * 100),
    precoAnteriorCents: null,
    emPromocao: false,
    percentualDesconto: null,
    custoMedioCents: row.custo_medio != null ? Math.round(Number(row.custo_medio) * 100) : null,
    estoqueAtual: row.estoque_atual,
    exigeReceita: null,
  };
}

const CONTROLLED_TIPO_LISTA = ["A1", "A2", "A3", "B1", "B2", "C1"];

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : DEFAULT_LIMIT;

  const pharmacyPool = new Pool({ connectionString: process.env.PHARMACY_SUPABASE_URL });

  // Candidatos: produto real com código de barras, em estoque, elegível
  // (não controlado), que ainda não tem linha em Product (nunca
  // espelhado) OU tem linha com imageUrl vazio (já tentou, não achou
  // antes — Kodebar pode achar agora). NOT IN direto no Postgres da
  // farmácia não enxerga a tabela Product (bancos diferentes), então o
  // filtro "nunca espelhado" é feito em memória contra o set já mirrorado.
  const mirroredCodigos = new Set(
    (await prisma.product.findMany({ where: { codigoProduto: { not: null } }, select: { codigoProduto: true } })).map(
      (p) => p.codigoProduto!
    )
  );
  const missingImageCodigos = new Set(
    (
      await prisma.product.findMany({
        where: { imageUrl: "", codigoProduto: { not: null } },
        select: { codigoProduto: true },
      })
    ).map((p) => p.codigoProduto!)
  );

  const catalogRes = await pharmacyPool.query<CatalogRow>(
    `SELECT codigo, codigo_barras, nome, marca, grupo, preco_venda, custo_medio, estoque_atual
     FROM produto_catalogo
     WHERE estoque_atual > 0
       AND codigo_barras IS NOT NULL AND codigo_barras <> ''
       AND (tipo_lista IS NULL OR tipo_lista <> ALL($1::text[]))
     ORDER BY updated_at DESC NULLS LAST`,
    [CONTROLLED_TIPO_LISTA]
  );

  const candidates = catalogRes.rows.filter(
    (row) => !mirroredCodigos.has(row.codigo) || missingImageCodigos.has(row.codigo)
  );

  console.log(`Candidatos sem foto: ${candidates.length} (processando até ${limit} nesta execução)`);

  let resolved = 0;
  let processed = 0;
  for (const row of candidates.slice(0, limit)) {
    if (processed > 0) await new Promise((r) => setTimeout(r, DELAY_BETWEEN_LOOKUPS_MS));
    processed++;

    const catalogProduct = rowToCatalogProduct(row);
    const product = await mirrorCatalogProduct(catalogProduct);
    const found = Boolean(product.imageUrl);
    if (found) resolved++;
    console.log(`${found ? "OK  " : "miss"} ${row.codigo}  ${row.nome.slice(0, 45)}`);
  }

  console.log(`\n${resolved}/${processed} resolvidas nesta execução. Restam ~${candidates.length - processed} candidatos.`);

  await pharmacyPool.end();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
