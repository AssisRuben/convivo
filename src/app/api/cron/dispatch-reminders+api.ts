import {
  dispatchCaregiverMissedDoseAlerts,
  dispatchDueFaithReminders,
  dispatchDueGoalTips,
  dispatchDueRoutineReminders,
  dispatchDueWisdomReminders,
  dispatchMedicationRepurchaseAlerts,
} from "@/lib/reminders/dispatchCore";
import { dispatchLoyaltyStoreSync } from "@/lib/loyalty/loyaltyCore";

// Sem scheduler configurado nesta sessão (não há hospedagem/deploy no
// escopo) — chamar manualmente por enquanto. Um cron de verdade (Vercel
// Cron ou similar) precisa apontar pra cá com o mesmo header no deploy.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [routineReminders, medicationAlerts, goalTips, wisdomReminders, faithReminders, caregiverAlerts, loyaltyStoreStamps] = await Promise.all([
    dispatchDueRoutineReminders(),
    dispatchMedicationRepurchaseAlerts(),
    dispatchDueGoalTips(),
    dispatchDueWisdomReminders(),
    dispatchDueFaithReminders(),
    dispatchCaregiverMissedDoseAlerts(),
    dispatchLoyaltyStoreSync(),
  ]);

  return Response.json({ routineReminders, medicationAlerts, goalTips, wisdomReminders, faithReminders, caregiverAlerts, loyaltyStoreStamps });
}
