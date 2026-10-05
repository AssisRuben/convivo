/**
 * Tipos do conteúdo de leitura (Pílulas de sabedoria e Gotas de Fé) —
 * compartilhados entre o servidor (que lê das tabelas Reading* no
 * Supabase) e as telas do app (que recebem pela API). Só tipos: o
 * conteúdo em si mora no banco desde 05/10/2026.
 *
 * Texto de paragraph/quote/list/footnote aceita **negrito**, *itálico* e
 * ***negrito itálico*** inline — renderizado por <RichText> na leitura.
 */
export type ReadingBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  // Aviso do autor no fim do capítulo (ex.: citações bíblicas de memória).
  | { type: "footnote"; text: string };

/** WISDOM = um tópico de Pílulas (decisoes-vieses, estoicismo, odisseia);
 * FAITH = um livro de Gotas de Fé (proverbios, marcos). Cada um é uma
 * trilha própria, numerada a partir de 1, com progresso independente. */
export type ReadingKind = "WISDOM" | "FAITH";

export type ReadingChapterSummary = { number: number; title: string; subtitle: string };

export type ReadingChapterView = ReadingChapterSummary & { blocks: ReadingBlock[] };

/** Livro com a lista de capítulos (sem o texto) — tela de lista. */
export type ReadingBookView = {
  slug: string;
  kind: ReadingKind;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  chapters: ReadingChapterSummary[];
};
