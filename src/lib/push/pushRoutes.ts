/**
 * Pra onde o toque numa notificação leva — usado pelos dois lados: o
 * servidor grava `data.url` em todo push (expoPush.ts) e o app navega pra
 * ela (_layout.tsx). Sem import de React Native aqui: roda no servidor.
 *
 * `screen` continua indo junto pros apps antigos, que só entendem ele.
 */
const SCREEN_URLS: Record<string, string> = {
  medicamentos: "/perfil/medicamentos",
  rotina: "/rotina",
  metas: "/perfil/metas",
  "pilulas-sabedoria": "/perfil/pilulas-sabedoria",
  "gotas-de-fe": "/perfil/gotas-de-fe",
  familia: "/perfil/familia",
  fidelidade: "/perfil/fidelidade",
  carteira: "/perfil/carteira",
  chat: "/conversa",
};

const THREAD_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** URL pro `data` de um push: `screen` (+ `threadId` no chat do gestor). */
export function pushUrlFor(data: Record<string, string> | undefined): string | undefined {
  const screen = data?.screen;
  if (!screen) return undefined;
  if (screen === "chat" && data.threadId && THREAD_ID.test(data.threadId)) {
    return `/conversa/${data.threadId}`;
  }
  return SCREEN_URLS[screen];
}

const ALLOWED_URLS = new Set(Object.values(SCREEN_URLS));

/**
 * Lado do app: a URL que o push trouxe, só se for uma das telas
 * conhecidas (o payload vem de fora — nada de navegar pra qualquer
 * coisa); senão, deduz pelo `screen`.
 */
export function resolvePushUrl(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const url = record.url;
  if (typeof url === "string") {
    if (ALLOWED_URLS.has(url)) return url;
    const thread = /^\/conversa\/([^/]+)$/.exec(url);
    if (thread && THREAD_ID.test(thread[1])) return url;
  }
  const strings: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") strings[key] = value;
  }
  return pushUrlFor(strings);
}
