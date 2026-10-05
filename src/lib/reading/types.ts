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

export type ReadingKind = "WISDOM" | "FAITH";

/** Pílulas de sabedoria é um "livro" só, com este slug. */
export const WISDOM_BOOK_SLUG = "pilulas-sabedoria";

/** Assunto: agrupa uma faixa de capítulos na lista (só Pílulas usa hoje). */
export type ReadingTopicView = {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firstChapter: number;
  lastChapter: number;
};

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
  topics: ReadingTopicView[];
  chapters: ReadingChapterSummary[];
};
