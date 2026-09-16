import { getApiUserId } from "@/lib/apiAuth";
import { getWisdomProgressForUser } from "@/lib/wisdom/wisdomCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const progress = await getWisdomProgressForUser(userId);
  return Response.json(progress);
}
