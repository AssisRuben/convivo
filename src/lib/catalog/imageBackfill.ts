import { Pool } from "pg";
import { prisma } from "@/lib/prisma";
import { mirrorCatalogProduct } from "@/lib/catalog/catalogMirror";
import { mapGrupoToCategory } from "@/constants/catalogCategories";
import type { CatalogProduct } from "@/lib/catalog/catalogDb";

/**
 * Rotina de fotos do catálogo — chamada em lotes pequenos e frequentes
 * pelo n8n (via /api/cron/backfill-product-images) e também pelo script
 * manual (npm run backfill:images). Só toca produto ainda sem foto.
 *
 * Diferente da primeira versão do script:
 * - Pula medicamento: nunca recebe foto de fonte externa (política de
 *   segurança em catalogMirror.ts), então só gastava vaga do lote.
 * - Espaça retentativas (imageCheckedAt): produto sem foto em nenhuma
 *   fonte só volta pra fila depois de RETRY_AFTER_DAYS — antes a mesma
 *   meia dúzia sem foto ocupava o topo toda vez e os novos nunca chegavam.
 * - Produto nunca espelhado vem antes do "já tentei e não achei".
 */
const CONTROLLED_TIPO_LISTA = ["A1", "A2", "A3", "B1", "B2", "C1"];
const RETRY_AFTER_DAYS = 7;

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

export type ImageBackfillResult = {
  pending: number;
  processed: number;
  resolved: number;
  items: { codigo: number; nome: string; found: boolean }[];
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

const globalForBackfill = globalThis as unknown as { backfillPool: Pool | undefined };

function getPharmacyPool(): Pool {
  const connectionString = process.env.PHARMACY_SUPABASE_URL;
  if (!connectionString) throw new Error("PHARMACY_SUPABASE_URL não configurada");
  if (!globalForBackfill.backfillPool) {
    globalForBackfill.backfillPool = new Pool({ connectionString, max: 2 });
  }
  return globalForBackfill.backfillPool;
}

export async function backfillProductImages(opts: {
  limit: number;
  delayMs: number;
  log?: (line: string) => void;
}): Promise<ImageBackfillResult> {
  const retryBefore = new Date(Date.now() - RETRY_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const mirrored = await prisma.product.findMany({
    where: { codigoProduto: { not: null } },
    select: { codigoProduto: true, imageUrl: true, imageCheckedAt: true },
  });
  const mirroredByCodigo = new Map(mirrored.map((p) => [p.codigoProduto!, p]));

  const catalogRes = await getPharmacyPool().query<CatalogRow>(
    `SELECT codigo, codigo_barras, nome, marca, grupo, preco_venda, custo_medio, estoque_atual
     FROM produto_catalogo
     WHERE estoque_atual > 0
       AND codigo_barras IS NOT NULL AND codigo_barras <> ''
       AND (tipo_lista IS NULL OR tipo_lista <> ALL($1::text[]))
     ORDER BY updated_at DESC NULLS LAST`,
    [CONTROLLED_TIPO_LISTA]
  );

  const neverMirrored: CatalogRow[] = [];
  const retryMissing: CatalogRow[] = [];
  for (const row of catalogRes.rows) {
    if (mapGrupoToCategory(row.grupo) === "MEDICAMENTOS") continue;
    const local = mirroredByCodigo.get(row.codigo);
    if (!local) {
      neverMirrored.push(row);
    } else if (!local.imageUrl && (!local.imageCheckedAt || local.imageCheckedAt < retryBefore)) {
      retryMissing.push(row);
    }
  }
  const candidates = [...neverMirrored, ...retryMissing];

  const result: ImageBackfillResult = { pending: candidates.length, processed: 0, resolved: 0, items: [] };

  for (const row of candidates.slice(0, opts.limit)) {
    if (result.processed > 0) await new Promise((r) => setTimeout(r, opts.delayMs));
    result.processed++;

    const product = await mirrorCatalogProduct(rowToCatalogProduct(row));
    const found = Boolean(product.imageUrl);
    await prisma.product.update({ where: { id: product.id }, data: { imageCheckedAt: new Date() } });
    if (found) result.resolved++;
    result.items.push({ codigo: row.codigo, nome: row.nome, found });
    opts.log?.(`${found ? "OK  " : "miss"} ${row.codigo}  ${row.nome.slice(0, 45)}`);
  }

  result.pending -= result.processed;
  return result;
}
