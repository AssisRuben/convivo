import { Pool } from "pg";

// Banco Supabase separado do banco do app — gestão interna da farmácia,
// sincronizado da Trier via n8n (produto_catalogo, clientes, vendas...).
// Só leitura: o convivo nunca escreve aqui, e o schema não é nosso pra
// migrar — por isso um Pool `pg` cru em vez de Prisma.
const globalForPharmacyDb = globalThis as unknown as { pharmacyPool: Pool | undefined };

function getPool(): Pool | null {
  const connectionString = process.env.PHARMACY_SUPABASE_URL;
  if (!connectionString) return null;

  if (!globalForPharmacyDb.pharmacyPool) {
    globalForPharmacyDb.pharmacyPool = new Pool({ connectionString });
  }
  return globalForPharmacyDb.pharmacyPool;
}

export type PurchaseHistoryItem = {
  itemId: string;
  vendaId: string;
  dataEmissao: string;
  codigoProduto: number;
  nomeProduto: string;
  quantidade: number;
  valorTotalLiquidoCents: number;
  nomeVendedor: string | null;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Últimos 8 dígitos — no telefone brasileiro isso é o "miolo" do número,
// estável independente de ter DDD, 9º dígito ou código de país na frente.
// CPF só tem 11 dígitos ao todo, então essa função nunca é chamada com CPF.
function last8Digits(value: string): string {
  const digits = onlyDigits(value);
  return digits.slice(-8);
}

/**
 * Acha o código do cliente na base da farmácia por CPF (mais confiável,
 * quando presente) ou telefone (cobre bem mais gente — CPF só existe em
 * ~76% dos cadastros reais, telefone em ~84%; os dois juntos cobrem ~97%).
 */
async function findCodigoCliente(
  pool: Pool,
  cpf: string | null,
  phone: string | null
): Promise<number | null> {
  const cpfDigits = cpf ? onlyDigits(cpf) : "";
  if (cpfDigits) {
    const res = await pool.query<{ codigo: number }>(
      `SELECT codigo FROM clientes WHERE regexp_replace(numero_cpf_cnpj, '\\D', '', 'g') = $1 LIMIT 1`,
      [cpfDigits]
    );
    if (res.rows[0]) return res.rows[0].codigo;
  }

  const phoneSuffix = phone ? last8Digits(phone) : "";
  if (phoneSuffix.length === 8) {
    const res = await pool.query<{ codigo: number }>(
      `SELECT codigo FROM clientes
       WHERE right(regexp_replace(coalesce(fone, ''), '\\D', '', 'g'), 8) = $1
          OR right(regexp_replace(coalesce(celular, ''), '\\D', '', 'g'), 8) = $1
       LIMIT 1`,
      [phoneSuffix]
    );
    if (res.rows[0]) return res.rows[0].codigo;
  }

  return null;
}

/**
 * Histórico de compras real do cliente na farmácia (loja física + qualquer
 * canal), casando por CPF com fallback pra telefone — ver `findCodigoCliente`.
 */
export async function getPurchaseHistoryForUser(
  cpf: string | null,
  phone: string | null
): Promise<PurchaseHistoryItem[]> {
  const pool = getPool();
  if (!pool) return [];

  const codigoCliente = await findCodigoCliente(pool, cpf, phone);
  if (codigoCliente == null) return [];

  const historyRes = await pool.query<{
    item_id: string;
    venda_id: string;
    data_emissao: Date;
    codigo_produto: number;
    nome_produto: string;
    quantidade_produtos: string;
    valor_total_liquido: string;
    nome_vendedor: string | null;
  }>(
    `SELECT item_id, venda_id, data_emissao, codigo_produto, nome_produto,
            quantidade_produtos, valor_total_liquido, nome_vendedor
     FROM vw_historico_compras_cliente
     WHERE codigo_cliente = $1
     ORDER BY data_emissao DESC
     LIMIT 200`,
    [codigoCliente]
  );

  return historyRes.rows.map((row) => ({
    itemId: String(row.item_id),
    vendaId: String(row.venda_id),
    dataEmissao: row.data_emissao.toISOString().slice(0, 10),
    codigoProduto: row.codigo_produto,
    nomeProduto: row.nome_produto,
    quantidade: Number(row.quantidade_produtos),
    valorTotalLiquidoCents: Math.round(Number(row.valor_total_liquido) * 100),
    nomeVendedor: row.nome_vendedor,
  }));
}

export type PharmacyCustomerAddress = {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  estado: string | null;
  telefone: string | null;
};

/**
 * Endereço (e telefone) já cadastrados na farmácia, pra pré-preencher o
 * checkout na primeira entrega em vez do cliente digitar tudo de novo —
 * ele continua livre pra editar/confirmar, isso nunca é salvo sozinho em
 * lugar nenhum por conta própria (quem decide salvar é o chamador, ver
 * app/api/mobile/profile/pharmacy-address+api.ts). `clientes` não tem
 * nome de cidade (só `codigo_cidade`, um código sem tabela de apoio
 * confirmada) — quem chama resolve a cidade a partir do `cep` devolvido
 * aqui via ViaCEP, mesmo caminho já usado pro CEP manual. `telefone`
 * prefere celular a fixo (mais provável de bater com WhatsApp/contato).
 */
export async function getCustomerAddressFromPharmacy(
  cpf: string | null,
  phone: string | null
): Promise<PharmacyCustomerAddress | null> {
  const pool = getPool();
  if (!pool) return null;

  const codigoCliente = await findCodigoCliente(pool, cpf, phone);
  if (codigoCliente == null) return null;

  const res = await pool.query<{
    cep: string | null;
    logradouro: string | null;
    numero_endereco: string | null;
    bairro: string | null;
    estado: string | null;
    celular: string | null;
    fone: string | null;
  }>(
    `SELECT cep, logradouro, numero_endereco, bairro, estado, celular, fone FROM clientes WHERE codigo = $1`,
    [codigoCliente]
  );

  const row = res.rows[0];
  if (!row || !row.cep) return null;

  return {
    cep: row.cep,
    logradouro: row.logradouro,
    numero: row.numero_endereco,
    telefone: row.celular || row.fone || null,
    bairro: row.bairro,
    estado: row.estado,
  };
}
