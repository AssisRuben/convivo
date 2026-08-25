
// Nenhuma tabela do catálogo real tem coluna de imagem — busca externa por
// código de barras. Mesmo padrão de graceful degradation de
// trier.ts/mercadopago.ts: nunca lança, null quando não encontrado em
// nenhuma fonte.
//
// Ordem: Open Food Facts → Open Products Facts (gratuitas, sem chave, sem
// limite de quota — mantidas por ONG, boa cobertura de alimento/bebida/
// higiene, que é o que sobra no catálogo já que receita/controlado é
// excluído) → Cosmos/Bluesoft (só se COSMOS_API_KEY estiver configurada;
// plano gratuito da Cosmos é bem limitado, por isso vem por último, como
// reforço, não fonte principal).
const OPEN_FACTS_TIMEOUT_MS = 4000;
const USER_AGENT = "Convivo-App/1.0";

export function isCosmosConfigured(): boolean {
  return Boolean(process.env.COSMOS_API_KEY);
}

async function fetchFromOpenFacts(domain: string, codigoBarras: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${domain}/api/v2/product/${encodeURIComponent(codigoBarras)}.json?fields=image_url`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(OPEN_FACTS_TIMEOUT_MS),
      }
    );
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

  try {
    const res = await fetch(`https://cosmos.bluesoft.com.br/api/gtins/${encodeURIComponent(codigoBarras)}.json`, {
      headers: { "X-Cosmos-Token": process.env.COSMOS_API_KEY! },
      signal: AbortSignal.timeout(OPEN_FACTS_TIMEOUT_MS),
    });
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

  const fromOpenFoodFacts = await fetchFromOpenFacts("world.openfoodfacts.org", codigoBarras);
  if (fromOpenFoodFacts) return fromOpenFoodFacts;

  const fromOpenProductsFacts = await fetchFromOpenFacts("world.openproductsfacts.org", codigoBarras);
  if (fromOpenProductsFacts) return fromOpenProductsFacts;

  return fetchFromCosmos(codigoBarras);
}
