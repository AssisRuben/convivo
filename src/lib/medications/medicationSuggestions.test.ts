import { describe, expect, it } from "vitest";
import { buildSuggestions } from "@/lib/medications/medicationSuggestions";
import type { PurchaseHistoryItem } from "@/lib/pharmacyDb";

const compra = (codigo: number, nome: string, data: string, qtd = 1): PurchaseHistoryItem => ({
  itemId: `${codigo}-${data}`,
  vendaId: "v",
  dataEmissao: data,
  codigoProduto: codigo,
  nomeProduto: nome,
  quantidade: qtd,
  valorTotalLiquidoCents: 0,
  nomeVendedor: null,
});

describe("sugestões de remédio a partir das compras", () => {
  const history = [
    compra(1, "CONVI OMEGA 3 1000MG 120CAP", "2026-08-17"),
    compra(1, "CONVI OMEGA 3 1000MG 120CAP", "2026-09-20", 2),
    compra(2, "ABS INTIMUS INT MEDIO 8UN", "2026-09-01"),
    compra(3, "LOSARTANA 50MG 30CP", "2026-07-01"),
    compra(4, "FRALDA PAMPERS G 40UN", "2026-09-10"),
  ];
  const groups = new Map<number, string | null>([
    [1, "LINHA GERAL"],
    [2, "ABSORVENTES"],
    [3, "GENERICO"],
    [4, "FRALDAS"],
  ]);

  it("tira absorvente e fralda, usa a compra mais recente e sugere comprimidos", () => {
    const result = buildSuggestions(history, groups, new Set());
    expect(result.map((s) => s.codigoProduto)).toEqual([1, 3]);
    expect(result[0]).toMatchObject({ purchaseDate: "2026-09-20", packQuantity: 2, suggestedUnits: 240 });
    expect(result[1]).toMatchObject({ packQuantity: 1, suggestedUnits: 30 });
  });

  it("não sugere o que já está cadastrado", () => {
    expect(buildSuggestions(history, groups, new Set([1])).map((s) => s.codigoProduto)).toEqual([3]);
  });
});
