import { getApiUserId } from "@/lib/apiAuth";
import { getAchievementsPage } from "@/lib/timeline/feedCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 10);

  const result = await getAchievementsPage(
    userId,
    Number.isFinite(offset) && offset >= 0 ? offset : 0,
    Number.isFinite(limit) && limit > 0 ? limit : 10
  );
  return Response.json(result);
}
