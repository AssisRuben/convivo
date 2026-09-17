import { getApiUserId } from "@/lib/apiAuth";
import { getFaithProgressForUser } from "@/lib/faith/faithCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const progress = await getFaithProgressForUser(userId);
  return Response.json(progress);
}
