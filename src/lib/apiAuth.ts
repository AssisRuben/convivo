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
 *
 * A checagem fica guardada por ACTIVE_CACHE_MS: o banco está longe
 * (~0,2 s por consulta) e isso era uma consulta extra em TODA requisição.
 * Excluir a conta tira da memória na hora (forgetActiveUser), então o
 * atraso só existiria entre processos — o servidor roda um só.
 */
const ACTIVE_CACHE_MS = 60_000;
const activeUntil = new Map<string, number>();

export function forgetActiveUser(userId: string): void {
  activeUntil.delete(userId);
}

export async function getApiUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const userId = await verifyMobileToken(authHeader.slice("Bearer ".length));
  if (!userId) return null;

  const cachedUntil = activeUntil.get(userId);
  if (cachedUntil && cachedUntil > Date.now()) return userId;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
  if (!user || user.deletedAt) {
    activeUntil.delete(userId);
    return null;
  }
  activeUntil.set(userId, Date.now() + ACTIVE_CACHE_MS);
  // não deixa o mapa crescer sem fim: limpa os vencidos de vez em quando
  if (activeUntil.size > 5000) {
    const now = Date.now();
    for (const [id, until] of activeUntil) if (until <= now) activeUntil.delete(id);
  }
  return userId;
}
