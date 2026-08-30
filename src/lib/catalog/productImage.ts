
// Nenhuma tabela do catálogo real tem coluna de imagem — busca externa por
// código de barras. Mesmo padrão de graceful degradation de
// trier.ts/mercadopago.ts: nunca lança, null quando não encontrado em
// nenhuma fonte.
//
// Ordem: Kodebar (base CMED de medicamentos ANVISA integrada — a fonte
// certa pra maioria deste catálogo, que é remédio, não comida; cota
// diária baixa no plano grátis, por isso primeiro só faz sentido porque
// falha rápido/barato quando esgota) → Open Food Facts → Open Products
// Facts (gratuitas, sem chave — mas TÊM rate limit na prática, mesmo sem
// token/quota documentada, ver circuit breaker abaixo; mantidas por ONG,
// boa cobertura de alimento/bebida/higiene, que é o resto do catálogo) →
// Cosmos/Bluesoft (só se COSMOS_API_KEY estiver configurada; plano
// gratuito da Cosmos é bem mais limitado ainda, por isso vem por último,
// como reforço, não fonte principal).
const OPEN_FACTS_TIMEOUT_MS = 4000;
const USER_AGENT = "Convivo-App/1.0";

const KODEBAR_HOST = "kodebar.korvensistemas.com.br";

export function isCosmosConfigured(): boolean {
  return Boolean(process.env.COSMOS_API_KEY);
}

export function isKodebarConfigured(): boolean {
  return Boolean(process.env.KODEBAR_API_KEY);
}

// Circuit breaker em memória (por processo), por domínio/fonte — achado
// em produção nesta sessão: tanto a Cosmos ("plano gratuito bem
// limitado", esperado) quanto o Open Food/Products Facts ("sem limite de
// quota", segundo o comentário original — mas na prática devolveu 429 de
// verdade depois de um lote de resolver ~70 imagens de uma vez pra home)
// bloqueiam por rate limit. Sem isso, cada item restante do lote bateria
// de novo na fonte já bloqueada e tomaria 429 de novo, um por um —
// desperdiça o resto da janela de cota à toa e deixa a resposta mais
// lenta sem ganhar nada.
const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000;
const rateLimitedUntilByHost = new Map<string, number>();

function isRateLimited(host: string): boolean {
  const until = rateLimitedUntilByHost.get(host);
  return until != null && Date.now() < until;
}

function markRateLimited(host: string, cooldownMs = RATE_LIMIT_COOLDOWN_MS): void {
  rateLimitedUntilByHost.set(host, Date.now() + cooldownMs);
}

// Cota da Kodebar é diária (reseta à meia-noite), não uma janela curta —
// diferente do 429 do Open Facts (rate limit de rajada, some em minutos),
// insistir de 5 em 5 min só desperdiça chamadas até o dia virar. Cooldown
// até a meia-noite local evita isso.
function msUntilNextMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

async function fetchFromKodebar(codigoBarras: string): Promise<string | null> {
  const apiKey = process.env.KODEBAR_API_KEY;
  if (!apiKey) return null;
  if (isRateLimited(KODEBAR_HOST)) return null;

  try {
    const res = await fetch(
      `https://${KODEBAR_HOST}/gtin/lookup?gtin=${encodeURIComponent(codigoBarras)}`,
      {
        headers: { "X-API-Key": apiKey },
        signal: AbortSignal.timeout(OPEN_FACTS_TIMEOUT_MS),
      }
    );

    if (res.status === 429) {
      markRateLimited(KODEBAR_HOST, msUntilNextMidnight());
      return null;
    }
    if (!res.ok) return null; // 401/404 inclusos — sem chave válida ou sem match, não é erro pra logar

    const data = await res.json();
    // quality_score da própria Kodebar: 0=miss, 1=fonte externa (auto-
    // enriquecido, ninguém confirmou que a foto bate com o produto real),
    // 2=cliente sem foto, 3=cliente com foto, 4=validado. Só aceita >= 3 —
    // score 1 é justamente o tipo de match automático sem verificação que
    // pode trazer a foto errada pro código de barras certo.
    const qualityScore = typeof data?.quality_score === "number" ? data.quality_score : 0;
    if (qualityScore < 3) return null;
    return typeof data?.thumbnail === "string" && data.thumbnail ? data.thumbnail : null;
  } catch {
    return null;
  }
}

async function fetchFromOpenFacts(domain: string, codigoBarras: string): Promise<string | null> {
  if (isRateLimited(domain)) return null;

  try {
    const res = await fetch(
      `https://${domain}/api/v2/product/${encodeURIComponent(codigoBarras)}.json?fields=image_url`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(OPEN_FACTS_TIMEOUT_MS),
      }
    );

    if (res.status === 429) {
      markRateLimited(domain);
      return null;
    }
    if (!res.ok) return null;

    const data = await res.json();
    const imageUrl = data?.product?.image_url;
    return data?.status === 1 && typeof imageUrl === "string" && imageUrl ? imageUrl : null;
  } catch {
    return null;
  }
}

async function fetchFromCosmos(codigoBarras: string): Promise<string | null> {
  if (!isCosmosConfigured()) return null;
  if (isRateLimited("cosmos.bluesoft.com.br")) return null;

  try {
    const res = await fetch(`https://cosmos.bluesoft.com.br/api/gtins/${encodeURIComponent(codigoBarras)}.json`, {
      headers: { "X-Cosmos-Token": process.env.COSMOS_API_KEY! },
      signal: AbortSignal.timeout(OPEN_FACTS_TIMEOUT_MS),
    });

    if (res.status === 429) {
      markRateLimited("cosmos.bluesoft.com.br");
      return null;
    }
    if (!res.ok) return null;

    const data = await res.json();
    return typeof data?.thumbnail === "string" && data.thumbnail ? data.thumbnail : null;
  } catch {
    return null;
  }
}

/**
 * Só deve ser chamada quando o espelho local ainda não tem uma imagem
 * real (ver upsertMirroredProduct em orderCore.ts/catalog+api routes) —
 * imagem é resolvida uma vez e cacheada, diferente de preço/estoque que
 * são sempre ao vivo.
 */
export async function fetchProductImageUrl(codigoBarras: string | null): Promise<string | null> {
  if (!codigoBarras) return null;

  const fromKodebar = await fetchFromKodebar(codigoBarras);
  if (fromKodebar) return fromKodebar;

  const fromOpenFoodFacts = await fetchFromOpenFacts("world.openfoodfacts.org", codigoBarras);
  if (fromOpenFoodFacts) return fromOpenFoodFacts;

  const fromOpenProductsFacts = await fetchFromOpenFacts("world.openproductsfacts.org", codigoBarras);
  if (fromOpenProductsFacts) return fromOpenProductsFacts;

  return fetchFromCosmos(codigoBarras);
}
