import { getReportHtmlByToken } from "@/lib/report/reportCore";

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  // dado de saúde: não guardar em cache de proxy nem indexar
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/** Relatório mensal aberto pelo link que o paciente compartilhou. */
export async function GET(_request: Request, { token }: Record<string, string>) {
  const html = await getReportHtmlByToken(token);
  if (!html) {
    return new Response(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Relatório indisponível</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#0b1e3d"><h1 style="font-size:20px">Relatório indisponível</h1><p>Este link expirou ou não existe. Peça ao paciente para gerar um novo pelo app Convivo.</p></body></html>`,
      { status: 404, headers: HEADERS }
    );
  }
  return new Response(html, { status: 200, headers: HEADERS });
}
