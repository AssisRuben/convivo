import { z } from "zod";
import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  token: z.string().min(1).max(512),
  // App antigo não manda: fica como está (create = vazio).
  capabilities: z.array(z.string().min(1).max(64)).max(32).optional(),
});

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Token inválido" }, { status: 400 });
  }

  const { token, capabilities } = parsed.data;
  await prisma.expoPushToken.upsert({
    where: { token },
    update: { userId, ...(capabilities ? { capabilities } : {}) },
    create: { userId, token, capabilities: capabilities ?? [] },
  });

  return Response.json({ ok: true });
}

const deleteSchema = z.object({ token: z.string().min(1).max(512) });

/**
 * Logout: este aparelho para de receber os pushes da conta. Só apaga se o
 * token for de quem está pedindo — ninguém desliga o push de outra pessoa.
 */
export async function DELETE(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Token inválido" }, { status: 400 });
  }

  await prisma.expoPushToken.deleteMany({ where: { token: parsed.data.token, userId } });
  return Response.json({ ok: true });
}
