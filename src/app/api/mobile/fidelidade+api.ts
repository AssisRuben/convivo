import { getApiUserId } from "@/lib/apiAuth";
import { getLoyaltyProgress } from "@/lib/loyalty/loyaltyCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const progress = await getLoyaltyProgress(userId);
  return Response.json(progress);
}
