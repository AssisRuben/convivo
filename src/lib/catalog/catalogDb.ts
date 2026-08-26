import { Pool } from "pg";

// Mesmo banco externo que pharmacyDb.ts já usa (PHARMACY_SUPABASE_URL) —
// catálogo/estoque/promoção reais da farmácia, sincronizados da Trier via
// n8n. Módulo separado de pharmacyDb.ts de propósito: aquele é só leitura
// (comentário original do arquivo), este ESCREVE (decrementCatalogStock),
// decisão consciente tomada nesta sessão pra permitir checkout de verdade
// — mantém óbvio, só pelo nome do arquivo, qual módulo tem esse efeito
// colateral.
const globalForCatalogDb = globalThis as unknown as { catalogPool: Pool | undefined };

function getPool(): Pool | null {
  const connectionString = process.env.PHARMACY_SUPABASE_URL;
  if (!connectionString) return null;

  if (!globalForCatalogDb.catalogPool) {
    globalForCatalogDb.catalogPool = new Pool({ connectionString });
  }
  return globalForCatalogDb.catalogPool;
}

export function isCatalogConfigured(): boolean {
  return getPool() !== null;
}

// Listas de controle da ANVISA (tipo_lista em produto_catalogo) — produto
// controlado fica de fora do catálogo do app por enquanto (confirmado),
// sem fluxo de receita construído ainda.
const CONTROLLED_TIPO_LISTA = ["A1", "A2", "A3", "B1", "B2", "C1"];

export type CatalogProduct = {
  codigo: number;
  codigoBarras: string | null;
  nome: string;
  marca: string | null;
  grupo: string | null;
  precoCents: number;
  precoAnteriorCents: number | null;
  emPromocao: boolean;
  percentualDesconto: number | null;
  custoMedioCents: number | null;
  estoqueAtual: number;
  // null = produtos ainda não sincronizado pra esse item, receita não
  // confirmada por aqui — informar/conferir no ato da entrega.
  exigeReceita: boolean | null;
};

function centsFromReais(value: string | number | null): number {
  if (value == null) return 0;
  return Math.round(Number(value) * 100);
}

// SELECT + join comuns a listCatalogForBrowsing e getCatalogProductByCodigo
// — LEFT JOIN: a tabela `produtos` (preço atual/promoção/receita) ainda
// não está sincronizada pelo n8n da farmácia (vazia por enquanto), então
// depender dela via INNER excluiria o catálogo inteiro. Preço cai pro
// `preco_venda` de produto_catalogo quando não há linha em `produtos`.
// Receita não é mais filtro de exclusão aqui — decisão do usuário: a
// exigência é informada e conferida no ato da entrega, não na vitrine.
// Controlado (tipo_lista) continua excluído, é uma restrição diferente
// (substância controlada), não relacionada a confirmar receita comum.
const BASE_SELECT = `
  SELECT pc.codigo, pc.codigo_barras, pc.nome, pc.marca, pc.grupo,
         COALESCE(p.preco_atual, pc.preco_venda) AS preco_atual,
         p.preco_anterior, p.em_promocao, p.percentual_desconto,
         p.exige_receita,
         pc.custo_medio, pc.estoque_atual
  FROM produto_catalogo pc
  LEFT JOIN produtos p ON p.codigo = pc.codigo
  WHERE pc.estoque_atual > 0
    AND (pc.tipo_lista IS NULL OR pc.tipo_lista <> ALL($1::text[]))
`;

type Row = {
  codigo: number;
  codigo_barras: string | null;
  nome: string;
  marca: string | null;
  grupo: string | null;
  preco_atual: string;
  preco_anterior: string | null;
  em_promocao: boolean | null;
  percentual_desconto: string | null;
  exige_receita: boolean | null;
  custo_medio: string | null;
  estoque_atual: number;
};

function rowToCatalogProduct(row: Row): CatalogProduct {
  return {
    codigo: row.codigo,
    codigoBarras: row.codigo_barras,
    nome: row.nome,
    marca: row.marca,
    grupo: row.grupo,
    precoCents: centsFromReais(row.preco_atual),
    precoAnteriorCents: row.preco_anterior != null ? centsFromReais(row.preco_anterior) : null,
    emPromocao: row.em_promocao ?? false,
    percentualDesconto: row.percentual_desconto != null ? Number(row.percentual_desconto) : null,
    custoMedioCents: row.custo_medio != null ? centsFromReais(row.custo_medio) : null,
    estoqueAtual: row.estoque_atual,
    exigeReceita: row.exige_receita,
  };
}

export async function listCatalogForBrowsing(opts: {
  // Lista de "grupo" de origem — várias entradas de origem mapeiam pra
  // uma categoria nossa só (ver grupoValuesForCategory), por isso lista,
  // não valor único. Omitido = sem filtro de categoria (vitrine geral).
  grupos?: string[];
  limit?: number;
  offset?: number;
  orderBy?: "updated_at" | "preco_atual_desc";
}): Promise<CatalogProduct[]> {
  const pool = getPool();
  if (!pool) return [];

  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  // "preco_atual" aqui é o alias do SELECT (COALESCE já resolvido), não a
  // coluna crua de `produtos` — que fica NULL pra quase tudo enquanto essa
  // tabela não é sincronizada.
  const order = opts.orderBy === "preco_atual_desc" ? "preco_atual DESC" : "pc.updated_at DESC NULLS LAST";

  const params: unknown[] = [CONTROLLED_TIPO_LISTA];
  let where = "";
  if (opts.grupos && opts.grupos.length > 0) {
    params.push(opts.grupos);
    where = ` AND pc.grupo = ANY($${params.length}::text[])`;
  }
  params.push(limit, offset);

  const res = await pool.query<Row>(
    `${BASE_SELECT}${where} ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return res.rows.map(rowToCatalogProduct);
}

export async function getCatalogProductByCodigo(codigo: number): Promise<CatalogProduct | null> {
  const pool = getPool();
  if (!pool) return null;

  const res = await pool.query<Row>(`${BASE_SELECT} AND pc.codigo = $2 LIMIT 1`, [
    CONTROLLED_TIPO_LISTA,
    codigo,
  ]);
  return res.rows[0] ? rowToCatalogProduct(res.rows[0]) : null;
}

/**
 * Promoções ativas agora — janela válida tanto da campanha quanto do
 * produto dentro da campanha (os dois têm data_inicio/data_fim próprios).
 * Passa pelo mesmo filtro de elegibilidade: produto controlado em
 * promoção continua de fora.
 */
export async function getActivePromotions(limit = 20): Promise<
  (CatalogProduct & { precoPromocionalCents: number })[]
> {
  const pool = getPool();
  if (!pool) return [];

  const res = await pool.query<Row & { preco_promocional: string }>(
    `SELECT pc.codigo, pc.codigo_barras, pc.nome, pc.marca, pc.grupo,
            COALESCE(p.preco_atual, pc.preco_venda) AS preco_atual,
            p.preco_anterior, p.em_promocao, p.percentual_desconto, p.exige_receita,
            pc.custo_medio, pc.estoque_atual, cp.preco_promocional
     FROM campanha_produtos cp
     INNER JOIN campanhas c ON c.id = cp.campanha_id
     INNER JOIN produto_catalogo pc ON pc.codigo = cp.codigo_produto
     LEFT JOIN produtos p ON p.codigo = pc.codigo
     WHERE CURRENT_DATE BETWEEN cp.data_inicio AND cp.data_fim
       AND CURRENT_DATE BETWEEN c.data_inicio AND c.data_fim
       AND pc.estoque_atual > 0
       AND (pc.tipo_lista IS NULL OR pc.tipo_lista <> ALL($1::text[]))
     ORDER BY cp.data_fim ASC
     LIMIT $2`,
    [CONTROLLED_TIPO_LISTA, limit]
  );

  return res.rows.map((row) => ({
    ...rowToCatalogProduct(row),
    precoPromocionalCents: centsFromReais(row.preco_promocional),
  }));
}

/**
 * Decremento atômico e condicional — a trava de verdade contra vender
 * mais do que existe. Não precisa de transação explícita: o próprio
 * UPDATE com WHERE já é atômico dentro do Postgres. Devolve false (sem
 * decrementar nada) se não havia estoque suficiente.
 */
export async function decrementCatalogStock(codigo: number, qty: number): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  const res = await pool.query(
    `UPDATE produto_catalogo SET estoque_atual = estoque_atual - $2
     WHERE codigo = $1 AND estoque_atual >= $2`,
    [codigo, qty]
  );
  return res.rowCount === 1;
}

/**
 * Restauração best-effort — nunca lança. Responsabilidade de quem chama
 * garantir que só roda uma vez por decremento bem-sucedido (não é
 * idempotente sozinha: chamar duas vezes devolve estoque em dobro).
 */
export async function incrementCatalogStock(codigo: number, qty: number): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`UPDATE produto_catalogo SET estoque_atual = estoque_atual + $2 WHERE codigo = $1`, [
      codigo,
      qty,
    ]);
  } catch {
    // Best-effort — mesmo espírito de rejectOrder/Trier/Mercado Pago.
  }
}
