/**
 * Cache em memória simples, processo único — substitui o `next: {
 * revalidate }` do fetch do Next.js, que não existe fora dele. Evita
 * bater nas APIs externas (Unsplash, NewsData, Ninjas, câmbio/Selic) a
 * cada scroll do feed.
 */
type Entry<T> = { expires: number; value: T };

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as T;

  const value = await compute();
  store.set(key, { expires: now + ttlSeconds * 1000, value });
  return value;
}
