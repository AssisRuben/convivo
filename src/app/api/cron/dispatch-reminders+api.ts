import {
  dispatchDueGoalTips,
  dispatchDueRoutineReminders,
  dispatchMedicationRepurchaseAlerts,
} from "@/lib/reminders/dispatchCore";

// Sem scheduler configurado nesta sessão (não há hospedagem/deploy no
// escopo) — chamar manualmente por enquanto. Um cron de verdade (Vercel
// Cron ou similar) precisa apontar pra cá com o mesmo header no deploy.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [routineReminders, medicationAlerts, goalTips] = await Promise.all([
    dispatchDueRoutineReminders(),
    dispatchMedicationRepurchaseAlerts(),
    dispatchDueGoalTips(),
  ]);

  return Response.json({ routineReminders, medicationAlerts, goalTips });
}
