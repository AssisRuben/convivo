import { lookupReferralCode } from "@/lib/referral/referralCore";

/**
 * De quem é um código de indicação — o app mostra "Código de Maria S."
 * antes de vincular ou no cadastro (sem login: quem está se cadastrando
 * ainda não tem conta). Só primeiro nome + inicial.
 */
export async function GET(_request: Request, { code }: Record<string, string>) {
  const owner = await lookupReferralCode(code ?? "");
  if (!owner) return Response.json({ error: "Código não encontrado" }, { status: 404 });
  return Response.json(owner);
}
