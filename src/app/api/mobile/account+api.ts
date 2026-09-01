import { getApiUserId } from "@/lib/apiAuth";
import { deleteUserAccount } from "@/lib/userAccount";

/**
 * Exclusão de conta (LGPD) — exige a senha de novo no corpo, não confia
 * só no token de sessão pra uma ação irreversível. Ver deleteUserAccount
 * em lib/userAccount.ts pro que de fato acontece (anonimização, não
 * DELETE de verdade).
 */
export async function DELETE(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (typeof password !== "string" || !password) {
    return Response.json({ error: "Informe sua senha pra confirmar" }, { status: 400 });
  }

  const result = await deleteUserAccount(userId, password);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true });
}
