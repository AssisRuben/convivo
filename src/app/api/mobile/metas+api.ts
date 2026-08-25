import { getApiUserId } from "@/lib/apiAuth";
import { createGoalForUser, listGoalsForUser } from "@/lib/goals/goalCore";
import type { GoalMetric } from "@/lib/generated/prisma/client";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const goals = await listGoalsForUser(userId);
  return Response.json({ goals });
}

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    await createGoalForUser(userId, {
      metric: body.metric as GoalMetric,
      title: String(body.title ?? ""),
      targetValue: body.targetValue != null ? Number(body.targetValue) : null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      routine: body.routine ?? undefined,
    });
    const goals = await listGoalsForUser(userId);
    return Response.json({ goals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar a meta";
    return Response.json({ error: message }, { status: 400 });
  }
}
