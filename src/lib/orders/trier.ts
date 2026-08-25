// Integração com a API SGF da Trier (efetuar-venda-v1) — receita validada
// contra produção em `d:\pagamentoapp\docs\API-SGF-EFETUAR-VENDA.md`:
// `enderecoEntrega` é obrigatório na prática mesmo em retirada (usar o
// endereço da própria farmácia nesse caso), `cliente` só precisa de
// nome+CPF, e `vendedor` não deve ser usado em venda de e-commerce.
import { centsToReais } from "@/lib/money";

export type TrierEnderecoEntrega = {
  logradouro: string;
  numero?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep?: string;
};

export type TrierVendaItem = {
  codigoProduto: number;
  nomeProduto: string;
  quantidade: number;
  valorUnitarioCents: number;
};

export type TrierEfetuarVendaInput = {
  numeroPedido: string;
  dataPedido: Date;
  valorTotalCents: number;
  clienteNome: string;
  clienteCpf: string;
  entrega: boolean;
  enderecoEntrega: TrierEnderecoEntrega;
  produtos: TrierVendaItem[];
};

export type TrierEfetuarVendaResult = {
  numeroNota: number;
  numeroPedido: string;
  statusPedido: { codigo: string; descricao: string };
};

function trierUrl(baseUrl: string, path: string): string {
  return `${baseUrl}/rest/integracao${path}`;
}

// Formato exigido pelo Trier: yyyy-MM-dd'T'HH:mm:ssZ (offset numérico). Usa
// UTC (+0000) em vez do fuso da farmácia — offset válido, evita lidar com
// fuso/horário de verão aqui.
function formatTrierDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "+0000");
}

/**
 * Endereço da própria farmácia — obrigatório em toda chamada por causa do
 * comportamento (não documentado) do endpoint, mesmo em retirada. Retorna
 * null se alguma variável de ambiente estiver faltando, pra quem chama
 * decidir pular a integração em vez de mandar um payload incompleto.
 */
export function getPharmacyEndereco(): TrierEnderecoEntrega | null {
  const logradouro = process.env.PHARMACY_LOGRADOURO;
  const bairro = process.env.PHARMACY_BAIRRO;
  const cidade = process.env.PHARMACY_CIDADE;
  const estado = process.env.PHARMACY_ESTADO;
  if (!logradouro || !bairro || !cidade || !estado) return null;

  return {
    logradouro,
    numero: process.env.PHARMACY_NUMERO,
    bairro,
    cidade,
    estado,
    cep: process.env.PHARMACY_CEP,
  };
}

export function isTrierConfigured(): boolean {
  return Boolean(
    process.env.TRIER_API_BASE_URL && process.env.TRIER_API_TOKEN && getPharmacyEndereco()
  );
}

/**
 * Registra a venda na Trier. Deixa o pedido como PENDENTE do lado deles —
 * não existe, via API, como avançar pra faturado/emitir nota; isso é
 * operação manual do caixa físico da farmácia (ver docs do pagamentoapp).
 */
export async function efetuarVendaTrier(
  input: TrierEfetuarVendaInput
): Promise<TrierEfetuarVendaResult> {
  const baseUrl = process.env.TRIER_API_BASE_URL;
  const token = process.env.TRIER_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("Trier não configurado (TRIER_API_BASE_URL/TRIER_API_TOKEN ausentes)");
  }

  const body = {
    numeroPedido: input.numeroPedido,
    dataPedido: formatTrierDate(input.dataPedido),
    valorTotalVenda: centsToReais(input.valorTotalCents),
    entrega: input.entrega,
    cliente: {
      nome: input.clienteNome,
      numeroCpfCnpj: input.clienteCpf,
    },
    enderecoEntrega: input.enderecoEntrega,
    produtos: input.produtos.map((item) => ({
      codigoProduto: item.codigoProduto,
      nomeProduto: item.nomeProduto.slice(0, 30),
      quantidade: item.quantidade,
      valorUnitario: centsToReais(item.valorUnitarioCents),
      valorDesconto: 0,
    })),
    pagamento: {
      pagamentoRealizado: true,
      valorParcela: centsToReais(input.valorTotalCents),
    },
  };

  const res = await fetch(trierUrl(baseUrl, "/venda/ecommerce/efetuar-venda-v1"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Trier efetuar-venda-v1 falhou (${res.status}): ${await res.text()}`);
  }

  return res.json();
}
