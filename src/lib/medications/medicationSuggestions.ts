import { prisma } from "@/lib/prisma";
import { getPurchaseHistoryForUser, type PurchaseHistoryItem } from "@/lib/pharmacyDb";
import { getCatalogGroups } from "@/lib/catalog/catalogDb";
import { mapGrupoToCategory, type CatalogCategorySlug } from "@/constants/catalogCategories";
import { unitsPerPackageFromName } from "@/lib/medications/medicationCore";

/**
 * Sugestões pro cadastro de remédio: o que a pessoa comprou na farmácia e
 * que se toma. Tira o que claramente não é (fralda, absorvente/higiene,
 * leite infantil, conveniência) — a lista misturada fez uma usuária
 * cadastrar absorvente como remédio. "OUTROS" fica: suplemento (ômega 3,
 * vitamina) costuma cair lá.
 */
const NOT_TAKEN: CatalogCategorySlug[] = ["FRALDAS", "HIGIENE_PERFUMARIA", "ALIMENTACAO_INFANTIL", "CONVENIENCIA"];
const MAX_SUGGESTIONS = 30;

export type MedicationSuggestion = {
  codigoProduto: number;
  productName: string;
  /** Data da compra mais recente, "YYYY-MM-DD". */
  purchaseDate: string;
  /** Caixas nessa compra — vira o padrão da recompra. */
  packQuantity: number;
  /** Comprimidos sugeridos pra "quantos você tem" (caixas × contagem do
   * nome); null quando o nome não diz quantos vêm por caixa. */
  suggestedUnits: number | null;
};

/** Pura: escolhe a compra mais recente de cada produto e aplica o filtro. */
export function buildSuggestions(
  history: PurchaseHistoryItem[],
  groups: Map<number, string | null>,
  alreadyTracked: Set<number>
): MedicationSuggestion[] {
  const latest = new Map<number, PurchaseHistoryItem>();
  for (const item of history) {
    const current = latest.get(item.codigoProduto);
    if (!current || item.dataEmissao > current.dataEmissao) latest.set(item.codigoProduto, item);
  }

  const result: MedicationSuggestion[] = [];
  for (const item of latest.values()) {
    if (alreadyTracked.has(item.codigoProduto)) continue;
    const category = mapGrupoToCategory(groups.get(item.codigoProduto) ?? null);
    if (NOT_TAKEN.includes(category)) continue;
    const packQuantity = Math.max(Math.round(item.quantidade), 1);
    const perPack = unitsPerPackageFromName(item.nomeProduto);
    result.push({
      codigoProduto: item.codigoProduto,
      productName: item.nomeProduto,
      purchaseDate: item.dataEmissao,
      packQuantity,
      suggestedUnits: perPack ? perPack * packQuantity : null,
    });
  }

  return result.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)).slice(0, MAX_SUGGESTIONS);
}

export async function getMedicationSuggestionsForUser(userId: string): Promise<MedicationSuggestion[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { cpf: true, phone: true, cpfVerifiedAt: true },
  });
  // Mesma regra do histórico de compras: dado de saúde, só com CPF
  // confirmado. Sem isso, o cadastro segue só com o nome digitado.
  if (!user.cpf || !user.phone || !user.cpfVerifiedAt) return [];

  const history = await getPurchaseHistoryForUser(user.cpf, user.phone);
  if (history.length === 0) return [];

  const [groups, tracked] = await Promise.all([
    getCatalogGroups([...new Set(history.map((h) => h.codigoProduto))]),
    prisma.medicationTracking.findMany({
      where: { userId, active: true, codigoProduto: { not: null } },
      select: { codigoProduto: true },
    }),
  ]);
  return buildSuggestions(history, groups, new Set(tracked.map((t) => t.codigoProduto!)));
}
