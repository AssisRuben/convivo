/**
 * Cache em memória (por processo do app, não persiste) pros dados das
 * abas principais. Sem isso, cada aba só busca ao ganhar foco pela
 * primeira vez — trocar de aba sempre mostra spinner, mesmo se o dado
 * pudesse já estar pronto. Com prefetch (chamado uma vez em
 * (tabs)/_layout.tsx assim que o usuário loga) as 4 abas começam a
 * buscar em paralelo em background; quando o usuário realmente toca
 * numa aba, os dados já estão (ou quase) prontos.
 *
 * Dedup: duas chamadas concorrentes pra mesma key (o prefetch e a
 * própria tela, se o usuário for rápido) compartilham a mesma promise
 * em vez de disparar duas requisições.
 */
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

/** Espelha o estado atual de uma tela no cache — chamado num useEffect
 * que observa o state, não em cada handler de mutação, pra não precisar
 * lembrar de sincronizar em todo lugar que muda o dado. */
export function setCached<T>(key: string, data: T): void {
  cache.set(key, data);
}

export function invalidateCached(key: string): void {
  cache.delete(key);
}

export function loadCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (cache.has(key)) return Promise.resolve(cache.get(key) as T);

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher()
    .then((data) => {
      cache.set(key, data);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}
