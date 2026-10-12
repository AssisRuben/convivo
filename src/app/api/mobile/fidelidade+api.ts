import { getApiUserId } from "@/lib/apiAuth";
import { getLoyaltyProgress, syncStoreStampsIfStale } from "@/lib/loyalty/loyaltyCore";
import { getCarePointsSummary } from "@/lib/points/pointsCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Compras no balcão viram selo: busca as novas antes de mostrar o cartão
  // (sem rede com a loja, mostra o que já tem).
  await syncStoreStampsIfStale(userId).catch((error) => console.error("[fidelidade] compras da loja:", error));

  const [progress, carePoints] = await Promise.all([getLoyaltyProgress(userId), getCarePointsSummary(userId)]);
  return Response.json({ ...progress, carePoints });
}
