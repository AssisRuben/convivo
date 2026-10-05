import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getCached, loadCached } from "@/lib/tabDataCache";
import type { ReadingBookView, ReadingChapterView } from "@/lib/reading/types";

/**
 * Conteúdo de leitura (Pílulas/Gotas) vindo da API — antes era importado
 * de src/constants/*.ts e ia dentro do app. Cache em memória pela sessão
 * (tabDataCache): abrir a lista ou reler um capítulo não baixa de novo.
 */
async function fetchJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Não foi possível carregar");
  return data as T;
}

type ResourceState<T> = { key: string | null; data: T | null; error: string | null };

function useCachedResource<T>(key: string | null, path: string) {
  const inicial = (k: string | null): ResourceState<T> => ({
    key: k,
    data: k ? getCached<T>(k) ?? null : null,
    error: null,
  });
  const [state, setState] = useState<ResourceState<T>>(() => inicial(key));

  useEffect(() => {
    if (!key) return;
    let ativo = true;
    loadCached(key, () => fetchJson<T>(path))
      .then((value) => {
        if (ativo) setState({ key, data: value, error: null });
      })
      .catch((e) => {
        if (ativo) {
          setState({ key, data: null, error: e instanceof Error ? e.message : "Não foi possível carregar" });
        }
      });
    return () => {
      ativo = false;
    };
  }, [key, path]);

  // Estado guardado é de outra key (ex.: trocou de capítulo): usa o cache
  // da key nova até a busca dela voltar, em vez de mostrar o anterior.
  const atual = state.key === key ? state : inicial(key);
  // sem key (slug/número inválido) não há o que carregar: não fica "carregando" pra sempre
  return {
    data: atual.data,
    error: atual.error,
    loading: key !== null && atual.data === null && atual.error === null,
  };
}

/** Livro + lista de capítulos (sem texto). */
export function useReadingBook(slug: string | undefined) {
  const s = slug ?? "";
  return useCachedResource<ReadingBookView>(slug ? `leitura:${s}` : null, `/api/mobile/leitura/${s}`);
}

/** Um capítulo com o texto. */
export function useReadingChapter(slug: string | undefined, numero: number) {
  const valido = Boolean(slug) && Number.isInteger(numero) && numero > 0;
  return useCachedResource<ReadingChapterView>(
    valido ? `leitura:${slug}:${numero}` : null,
    `/api/mobile/leitura/${slug}/${numero}`
  );
}
