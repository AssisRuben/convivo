// Taxonomia de vitrine curada por nós, mapeada a partir do `grupo` de
// origem (não `categoria` — os dois existem no catálogo real, mas
// `categoria` é inconsistente pro mesmo produto em registros diferentes,
// confirmado nos dados reais; `grupo` é o campo estável). Mesmo padrão de
// CARE_CATEGORY_META (constants/careCategories.ts): mapa fixo em código,
// não tabela no banco — muda pouco, e a gente controla a curadoria.

export type CatalogCategorySlug =
  | "FRALDAS"
  | "HIGIENE_PERFUMARIA"
  | "ALIMENTACAO_INFANTIL"
  | "CONVENIENCIA"
  | "MEDICAMENTOS"
  | "OUTROS";

export const CATALOG_CATEGORY_META: Record<CatalogCategorySlug, { label: string; emoji: string }> = {
  FRALDAS: { label: "Fraldas", emoji: "🍼" },
  HIGIENE_PERFUMARIA: { label: "Higiene e Perfumaria", emoji: "🧴" },
  ALIMENTACAO_INFANTIL: { label: "Alimentação infantil", emoji: "🥛" },
  CONVENIENCIA: { label: "Conveniência", emoji: "🍫" },
  MEDICAMENTOS: { label: "Medicamentos", emoji: "💊" },
  OUTROS: { label: "Outros", emoji: "🛍️" },
};

export const CATALOG_CATEGORIES = Object.keys(CATALOG_CATEGORY_META) as CatalogCategorySlug[];

// Chave sempre em maiúsculas/sem espaço nas pontas pra bater com o "grupo"
// de origem (que já vem assim, mas normaliza mesmo assim por segurança).
const GRUPO_TO_CATEGORY: Record<string, CatalogCategorySlug> = {
  FRALDAS: "FRALDAS",

  PERFUMARIA: "HIGIENE_PERFUMARIA",
  ABSORVENTES: "HIGIENE_PERFUMARIA",

  LEITES: "ALIMENTACAO_INFANTIL",

  CHOCOLATE: "CONVENIENCIA",
  SORVETE: "CONVENIENCIA",
  REFRIGERANTES: "CONVENIENCIA",
  BISCOITOS: "CONVENIENCIA",

  ETICO: "MEDICAMENTOS",
  GENERICO: "MEDICAMENTOS",
  SIMILAR: "MEDICAMENTOS",
  "LINHA GERAL": "MEDICAMENTOS",

  ACESSORIOS: "OUTROS",
  "ACESSORIOS HOSPITALARES": "OUTROS",
  "PRODUTOS HOSPITALARES": "OUTROS",
};

/** Nunca deixa um `grupo` desconhecido sumir — cai em OUTROS em vez de ser descartado. */
export function mapGrupoToCategory(grupo: string | null): CatalogCategorySlug {
  if (!grupo) return "OUTROS";
  return GRUPO_TO_CATEGORY[grupo.trim().toUpperCase()] ?? "OUTROS";
}

// Inverso do mapa acima — vários "grupo" de origem caem no mesmo slug
// nosso (ex: CHOCOLATE/SORVETE/REFRIGERANTES/BISCOITOS → CONVENIENCIA),
// então filtrar por categoria nossa no banco externo precisa da lista
// inteira de "grupo" que mapeiam pra ela, não um valor só.
export function grupoValuesForCategory(slug: CatalogCategorySlug): string[] {
  return Object.entries(GRUPO_TO_CATEGORY)
    .filter(([, mappedSlug]) => mappedSlug === slug)
    .map(([grupo]) => grupo);
}

// Puro (sem `process.env`/fetch) de propósito — além do backend (upsert do
// espelho local em catalogMirror.ts/catalogView.ts), também é usado
// direto no cliente (ProductImage.tsx) pra reagir a link de imagem
// externa quebrado em tempo de render, sem depender de nada server-only.
export function fallbackImageForCategory(category: CatalogCategorySlug): string {
  const emoji = CATALOG_CATEGORY_META[category].emoji;
  return `https://placehold.co/400x400/fafaf7/0b1e3d?text=${encodeURIComponent(emoji)}`;
}
