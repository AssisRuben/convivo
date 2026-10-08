import { getApiUserId } from "@/lib/apiAuth";
import { createReportShare } from "@/lib/report/reportCore";

/** Cria o link do relatório mensal pro médico. Body: { month: "YYYY-MM" }. */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { token, expiresAt } = await createReportShare(userId, String(body?.month ?? ""));
    // O app monta o endereço com a URL do servidor que ele já conhece
    // (atrás do proxy, a origem vista aqui pode não ser a pública).
    return Response.json({ path: `/r/${token}`, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o relatório";
    return Response.json({ error: message }, { status: 400 });
  }
}
