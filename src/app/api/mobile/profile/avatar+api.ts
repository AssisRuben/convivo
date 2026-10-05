import { getApiUserId } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

// A foto chega já reduzida pelo app (~400px JPEG, dezenas de KB) — o teto
// aqui só barra envio fora do padrão, não é o tamanho esperado.
const MAX_BASE64_LENGTH = 400_000;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);

/** Foto de perfil do próprio usuário, como data URL (null se não tiver). */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const avatar = await prisma.userAvatar.findUnique({ where: { userId } });
  return Response.json({
    avatar: avatar
      ? { dataUrl: `data:${avatar.mimeType};base64,${avatar.dataBase64}`, updatedAt: avatar.updatedAt.toISOString() }
      : null,
  });
}

export async function PUT(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { base64?: string; mimeType?: string } | null;
  const base64 = body?.base64?.trim();
  const mimeType = body?.mimeType ?? "image/jpeg";
  if (!base64 || !ALLOWED_MIME.has(mimeType) || !/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) {
    return Response.json({ error: "Imagem inválida" }, { status: 400 });
  }
  if (base64.length > MAX_BASE64_LENGTH) {
    return Response.json({ error: "Imagem muito grande" }, { status: 413 });
  }

  const avatar = await prisma.userAvatar.upsert({
    where: { userId },
    create: { userId, mimeType, dataBase64: base64 },
    update: { mimeType, dataBase64: base64 },
  });
  return Response.json({
    avatar: { dataUrl: `data:${avatar.mimeType};base64,${avatar.dataBase64}`, updatedAt: avatar.updatedAt.toISOString() },
  });
}

export async function DELETE(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  await prisma.userAvatar.deleteMany({ where: { userId } });
  return Response.json({ avatar: null });
}
