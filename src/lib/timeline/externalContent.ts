import { pickWellnessFacts } from "./wellnessFacts";
import { cached } from "./memoCache";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const NINJA_API_KEY = process.env.NINJA_API_KEY;
const NINJA_FACTS_MAX_LIMIT = 30;
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;
const NEWS_MAX_LIMIT = 10;

const FRASES_JSON_URL =
  "https://raw.githubusercontent.com/devmatheusguerra/frasesJSON/master/frases.json";
const GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-BR";

export type WellnessFact = { text: string };
export type FinanceSnippet = { text: string };
export type FunQuote = { text: string; author: string };
export type NewsItem = { title: string; message: string; imageUrl: string | null; sourceUrl: string };

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchNewsDataArticles(limit: number): Promise<NewsItem[]> {
  if (!NEWSDATA_API_KEY) return [];
  return cached(`newsdata:${limit}`, 3600, async () => {
    try {
      const url = new URL("https://newsdata.io/api/1/latest");
      url.searchParams.set("apikey", NEWSDATA_API_KEY);
      url.searchParams.set("country", "br");
      url.searchParams.set("language", "pt");
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const results: {
        title?: string;
        description?: string;
        image_url?: string;
        link?: string;
      }[] = data?.results ?? [];

      return results
        .filter((r) => r.title && r.link)
        .slice(0, limit)
        .map((r) => ({
          title: r.title!,
          message: r.description ?? r.title!,
          imageUrl: r.image_url ?? null,
          sourceUrl: r.link!,
        }));
    } catch {
      return [];
    }
  });
}

/**
 * Fallback sem chave nenhuma — RSS público do Google Notícias, sempre
 * disponível, mas sem foto (por isso só usado se a NewsData.io falhar ou
 * não tiver chave configurada).
 */
async function fetchGoogleNewsRss(limit: number): Promise<NewsItem[]> {
  return cached(`googlenews:${limit}`, 3600, async () => {
    try {
      const res = await fetch(GOOGLE_NEWS_RSS_URL);
      if (!res.ok) return [];
      const xml = await res.text();

      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit);
      return items
        .map((match) => {
          const block = match[1];
          const title = decodeXmlEntities(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
          const link = decodeXmlEntities(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
          const source = decodeXmlEntities(
            block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? ""
          );
          return {
            title,
            message: source ? `Via ${source}` : "Leia a matéria completa.",
            imageUrl: null,
            sourceUrl: link,
          };
        })
        .filter((item) => item.title && item.sourceUrl);
    } catch {
      return [];
    }
  });
}

/**
 * Notícias relevantes do Brasil pro feed — NewsData.io como fonte
 * principal (vem com foto, mas precisa de chave grátis e tem limite
 * diário de créditos). Sem chave configurada, ou se a chamada falhar, cai
 * pro RSS do Google Notícias (sem chave, sem limite, mas sem foto).
 */
export async function fetchNews(limit = NEWS_MAX_LIMIT): Promise<NewsItem[]> {
  const primary = await fetchNewsDataArticles(limit);
  if (primary.length > 0) return primary;
  return fetchGoogleNewsRss(limit);
}

/**
 * Curiosidades do dia, uma por post — puxadas da API Ninjas (Facts API,
 * `limit` máximo de 30 por chamada, o teto real da API, não uma escolha
 * nossa). Vem só em inglês, a API não tem parâmetro de idioma. Se a chave
 * não estiver configurada ou a chamada falhar, cai pra lista curada em
 * PT-BR (`wellnessFacts.ts`) — o feed nunca fica sem esses posts.
 */
export async function fetchNinjaFacts(limit = NINJA_FACTS_MAX_LIMIT): Promise<WellnessFact[]> {
  const cappedLimit = Math.min(limit, NINJA_FACTS_MAX_LIMIT);

  if (NINJA_API_KEY) {
    const facts = await cached(`ninjafacts:${cappedLimit}`, 3600, async () => {
      try {
        const url = new URL("https://api.api-ninjas.com/v1/facts");
        url.searchParams.set("limit", String(cappedLimit));
        const res = await fetch(url, { headers: { "X-Api-Key": NINJA_API_KEY } });
        if (res.ok) {
          const data: { fact: string }[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((d) => ({ text: d.fact }));
          }
        }
      } catch {
        // cai pro fallback abaixo
      }
      return null;
    });
    if (facts) return facts;
  }

  return pickWellnessFacts(cappedLimit).map((text) => ({ text }));
}

/**
 * Câmbio (AwesomeAPI: dólar, euro, bitcoin, num único request multi-par) +
 * Selic e IPCA (BCB SGS séries 432 e 433), combinados num texto único.
 * Nenhuma das duas exige chave.
 */
export async function fetchFinanceSnippet(): Promise<FinanceSnippet | null> {
  return cached("finance", 3600, async () => {
    try {
      const [cambioRes, selicRes, ipcaRes] = await Promise.all([
        fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL"),
        fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"),
        fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json"),
      ]);

      const parts: string[] = [];

      if (cambioRes.ok) {
        const cambioData = await cambioRes.json();
        const dolar = cambioData?.USDBRL?.bid;
        const euro = cambioData?.EURBRL?.bid;
        const bitcoin = cambioData?.BTCBRL?.bid;

        if (dolar) parts.push(`Dólar: R$ ${Number(dolar).toFixed(2).replace(".", ",")}`);
        if (euro) parts.push(`Euro: R$ ${Number(euro).toFixed(2).replace(".", ",")}`);
        if (bitcoin) {
          const valor = Number(bitcoin);
          const label = valor >= 1000 ? `${(valor / 1000).toFixed(1)} mil` : valor.toFixed(0);
          parts.push(`Bitcoin: R$ ${label.replace(".", ",")}`);
        }
      }

      if (selicRes.ok) {
        const selicData = await selicRes.json();
        const valor = selicData?.[0]?.valor;
        if (valor) parts.push(`Selic: ${String(valor).replace(".", ",")}% a.a.`);
      }

      if (ipcaRes.ok) {
        const ipcaData = await ipcaRes.json();
        const valor = ipcaData?.[0]?.valor;
        if (valor) parts.push(`IPCA do mês: ${String(valor).replace(".", ",")}%`);
      }

      if (parts.length === 0) return null;
      return { text: parts.join(" · ") };
    } catch {
      return null;
    }
  });
}

/**
 * Frase do dia, escolhida deterministicamente pelo dia do ano dentro do
 * JSON estático (hospedado no GitHub — grátis, sem chave, sem limite
 * prático). Mesma frase pra todo mundo no mesmo dia.
 */
export async function fetchFunQuote(): Promise<FunQuote | null> {
  return cached("quote", 86400, async () => {
    try {
      const res = await fetch(FRASES_JSON_URL);
      if (!res.ok) return null;
      const frases: { autor: string; frase: string }[] = await res.json();
      if (!Array.isArray(frases) || frases.length === 0) return null;

      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      const escolhida = frases[dayOfYear % frases.length];
      return { text: escolhida.frase, author: escolhida.autor };
    } catch {
      return null;
    }
  });
}

/**
 * Foto de capa por palavra-chave (Unsplash). Retorna null se não tiver
 * chave configurada ou a busca falhar — os cards funcionam sem imagem.
 */
export async function fetchCoverImage(query: string): Promise<string | null> {
  const [first] = await fetchCoverImages(query, 1);
  return first ?? null;
}

/**
 * Várias fotos de uma vez (Unsplash, `per_page` até 30) — uma única
 * chamada, cacheada por 24h, em vez de uma chamada por post. Usada pra dar
 * uma foto diferente a cada curiosidade do feed, sem repetir a mesma em
 * todo card nem estourar o limite de requisições da conta gratuita.
 */
export async function fetchCoverImages(query: string, count: number): Promise<string[]> {
  if (!UNSPLASH_ACCESS_KEY || count <= 0) return [];
  return cached(`unsplash:${query}:${count}`, 86400, async () => {
    try {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", query);
      url.searchParams.set("per_page", String(Math.min(count, 30)));
      url.searchParams.set("orientation", "landscape");

      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const results: { urls?: { regular?: string } }[] = data?.results ?? [];
      return results.map((r) => r.urls?.regular).filter((url): url is string => Boolean(url));
    } catch {
      return [];
    }
  });
}

const FACT_IMAGE_THEMES = [
  "ciência",
  "natureza",
  "espaço",
  "tecnologia",
  "história",
  "animais",
  "oceano",
  "universo",
];

/**
 * Mesma ideia do `fetchCoverImages`, mas buscando em vários temas em vez
 * de um só — resultados de uma busca única (ex: "curiosidades ciência")
 * tendem a vir visualmente parecidos entre si. Um request por tema
 * (cacheado 24h cada) dá muito mais variedade de foto entre as
 * curiosidades do feed.
 */
export async function fetchDiverseCoverImages(totalCount: number): Promise<string[]> {
  if (totalCount <= 0) return [];
  const perTheme = Math.max(1, Math.ceil(totalCount / FACT_IMAGE_THEMES.length));
  const batches = await Promise.all(
    FACT_IMAGE_THEMES.map((theme) => fetchCoverImages(theme, perTheme))
  );
  return batches.flat();
}
