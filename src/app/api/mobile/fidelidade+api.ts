import { getApiUserId } from "@/lib/apiAuth";
import { getLoyaltyProgress } from "@/lib/loyalty/loyaltyCore";
import { getCarePointsSummary } from "@/lib/points/pointsCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [progress, carePoints] = await Promise.all([getLoyaltyProgress(userId), getCarePointsSummary(userId)]);
  return Response.json({ ...progress, carePoints });
}
