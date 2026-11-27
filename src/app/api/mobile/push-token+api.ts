import { z } from "zod";
import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  token: z.string().min(1).max(512),
  // App antigo não manda: fica como está (create = vazio).
  capabilities: z.array(z.string().min(1).max(64)).max(32).optional(),
  // Até que dia o aparelho já agendou os lembretes de rotina (null = nada
  // agendado, ex.: permissão tirada). Ausente = não mexe.
  localRemindersUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
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

  const { token, capabilities, localRemindersUntil } = parsed.data;
  // Token trocando de dono (outra conta logou neste aparelho): o
  // agendamento guardado era da conta anterior, não vale pra esta.
  const existing = await prisma.expoPushToken.findUnique({ where: { token }, select: { userId: true } });
  const ownerChanged = existing !== null && existing.userId !== userId;
  const until =
    localRemindersUntil !== undefined
      ? { localRemindersUntil: localRemindersUntil ? new Date(`${localRemindersUntil}T00:00:00Z`) : null }
      : ownerChanged
        ? { localRemindersUntil: null }
        : {};
  await prisma.expoPushToken.upsert({
    where: { token },
    update: { userId, ...(capabilities ? { capabilities } : {}), ...until },
    create: { userId, token, capabilities: capabilities ?? [], ...until },
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
