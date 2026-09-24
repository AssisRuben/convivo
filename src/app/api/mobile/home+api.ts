import { getApiUserId } from "@/lib/apiAuth";
import { getHomeDashboardForUser } from "@/lib/home/homeCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dashboard = await getHomeDashboardForUser(userId);
  return Response.json(dashboard);
}
