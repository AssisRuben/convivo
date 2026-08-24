import { z } from "zod";
import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Token inválido" }, { status: 400 });
  }

  await prisma.expoPushToken.upsert({
    where: { token: parsed.data.token },
    update: { userId },
    create: { userId, token: parsed.data.token },
  });

  return Response.json({ ok: true });
}
