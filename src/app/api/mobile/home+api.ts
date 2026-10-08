import { getApiUserId } from "@/lib/apiAuth";
import { getHomeDashboardForUser } from "@/lib/home/homeCore";
import { getCaregivingSummary } from "@/lib/care/caregiverCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Resumo de quem eu acompanho (modo cuidador) junto do dashboard — fica
  // aqui e não no homeCore porque caregiverCore já importa o homeCore.
  const [dashboard, caregiving] = await Promise.all([
    getHomeDashboardForUser(userId),
    getCaregivingSummary(userId),
  ]);
  return Response.json({ ...dashboard, caregiving });
}
