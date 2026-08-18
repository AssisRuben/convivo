import { verifyMobileToken } from "@/lib/mobileAuth";

/**
 * Autentica as rotas de API (`app/api/mobile/**+api.ts`) via
 * `Authorization: Bearer <jwt>` — diferente do pagamentoapp, aqui não
 * existe sessão web (NextAuth), o app é só o cliente Expo.
 */
export async function getApiUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyMobileToken(authHeader.slice("Bearer ".length));
  }
  return null;
}
