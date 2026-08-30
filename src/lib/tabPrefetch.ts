import {
  apiFetch,
  type ApiCatalogHome,
  type ApiChecklistItem,
  type ApiFeedPage,
  type ApiHealthMeasurement,
} from "@/lib/api";
import { loadCached } from "@/lib/tabDataCache";

// Uma key de cache por aba principal — usadas tanto pelas telas (leitura/
// escrita do próprio state) quanto pelo prefetch abaixo (escrita em
// background). O tamanho de página do feed aqui precisa bater com
// PAGE_SIZE em (tabs)/index.tsx — é só a carga inicial (offset 0) que
// entra em cache; paginação seguinte não passa por aqui.
export const FEED_INITIAL_CACHE_KEY = "feed:initial";
export const CATALOG_HOME_CACHE_KEY = "catalog:home";
export const ROTINA_CACHE_KEY = "rotina:items";
export const SAUDE_CACHE_KEY = "saude:measurements";

export async function fetchFeedInitial(): Promise<ApiFeedPage> {
  const res = await apiFetch("/api/mobile/feed?offset=0&limit=10");
  if (!res.ok) return { items: [], hasMore: false };
  return res.json();
}

export async function fetchCatalogHome(): Promise<ApiCatalogHome> {
  const res = await apiFetch("/api/mobile/catalog/home");
  return res.json();
}

export async function fetchRotina(): Promise<{ items: ApiChecklistItem[] }> {
  const res = await apiFetch("/api/mobile/rotina");
  if (!res.ok) return { items: [] };
  return res.json();
}

export async function fetchSaude(): Promise<{ measurements: ApiHealthMeasurement[] }> {
  const res = await apiFetch("/api/mobile/saude");
  if (!res.ok) return { measurements: [] };
  return res.json();
}

/**
 * Chamado uma vez, assim que o usuário loga (ver (tabs)/_layout.tsx) —
 * dispara a busca das 4 abas em paralelo em background, sem esperar o
 * usuário tocar em cada uma. Quando a tela realmente monta, ela chama
 * `loadCached` com a mesma key/fetcher: se o prefetch já terminou, usa o
 * resultado na hora (sem spinner); se ainda tá em voo, entra na mesma
 * promise em vez de disparar uma segunda requisição.
 *
 * Erros são engolidos aqui de propósito — isso é só o atalho do caminho
 * feliz. Se falhar, a tela ainda tenta buscar sozinha quando for
 * focada (loadCached não guarda erro em cache, só sucesso).
 */
export function prefetchAllTabs(): void {
  loadCached(FEED_INITIAL_CACHE_KEY, fetchFeedInitial).catch(() => {});
  loadCached(CATALOG_HOME_CACHE_KEY, fetchCatalogHome).catch(() => {});
  loadCached(ROTINA_CACHE_KEY, fetchRotina).catch(() => {});
  loadCached(SAUDE_CACHE_KEY, fetchSaude).catch(() => {});
}
