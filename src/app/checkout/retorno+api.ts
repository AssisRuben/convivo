/**
 * Página HTML mínima e pública que serve de `back_urls` da preferência do
 * Mercado Pago — precisa ser HTTPS de verdade, não dá pra usar o esquema
 * customizado do app direto ali. Redireciona pro deep link do app assim
 * que carrega; o parâmetro `status`/`payment_id` que o MP anexa aqui é só
 * cosmético (mostrado pro usuário enquanto o redirect acontece), nunca é
 * usado pra decidir se o pedido foi aprovado — quem decide isso é sempre
 * o webhook lendo o status direto na API do MP.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order") ?? "";
  const deepLink = `convivo://perfil/pedidos/${orderId}`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta http-equiv="refresh" content="0;url=${deepLink}" />
<title>Voltando pro Convivo…</title>
<style>
  body { font-family: system-ui, sans-serif; background: #fafaf7; color: #0b1e3d;
         display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  p { text-align: center; padding: 0 24px; }
</style>
</head>
<body>
<p>Voltando pro Convivo… se nada acontecer, pode fechar esta janela e abrir o app.</p>
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
