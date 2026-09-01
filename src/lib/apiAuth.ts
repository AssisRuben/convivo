import { verifyMobileToken } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

/**
 * Autentica as rotas de API (`app/api/mobile/**+api.ts`) via
 * `Authorization: Bearer <jwt>` — diferente do pagamentoapp, aqui não
 * existe sessão web (NextAuth), o app é só o cliente Expo.
 *
 * Confere `deletedAt` a cada chamada (não só no login) — o JWT dura 30
 * dias e não tem revogação própria, então sem essa checagem uma conta
 * excluída continuaria autenticada com o token antigo até ele expirar
 * sozinho.
 */
export async function getApiUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const userId = await verifyMobileToken(authHeader.slice("Bearer ".length));
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
  if (!user || user.deletedAt) return null;

  return userId;
}
