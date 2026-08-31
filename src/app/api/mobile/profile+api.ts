import { getApiUserId } from "@/lib/apiAuth";
import { getProfileForUser, updateProfileForUser, type ProfileInput } from "@/lib/profile/profileCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const profile = await getProfileForUser(userId);
  return Response.json({ profile });
}

export async function PATCH(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ProfileInput | null;
  if (!body) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const { profile, cpfVerification } = await updateProfileForUser(userId, body);
    return Response.json({ profile, cpfVerification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}
