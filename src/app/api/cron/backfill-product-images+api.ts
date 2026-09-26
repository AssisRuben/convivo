import { backfillProductImages } from "@/lib/catalog/imageBackfill";

// Chamado pelo n8n em lotes pequenos (ver imageBackfill.ts) — mesmo
// header Bearer CRON_SECRET do dispatch-reminders. Lote curto de propósito:
// cada produto pode levar vários segundos (4 fontes em sequência + pausa
// entre consultas pra não tomar 429), e a chamada HTTP não pode demorar
// minutos. ?limit= ajusta o tamanho (máx. 15). Padrão 2 por chamada: a
// Kodebar libera 50 consultas/dia (+5 de tolerância, zera à meia-noite de
// Brasília) — chamando de hora em hora dá 48/dia, dentro da cota.
const DEFAULT_LIMIT = 2;
const MAX_LIMIT = 15;
const DELAY_BETWEEN_LOOKUPS_MS = 4000;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const limitParam = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    const result = await backfillProductImages({ limit, delayMs: DELAY_BETWEEN_LOOKUPS_MS });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha na rotina de imagens";
    return Response.json({ error: message }, { status: 500 });
  }
}
