import { getApiUserId } from "@/lib/apiAuth";
import { getRoutineItemDetailForUser } from "@/lib/care/routineDetailCore";

/** Streak e próxima ocorrência de um cuidado — pro modal de detalhe da Rotina. */
export async function GET(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const detail = await getRoutineItemDetailForUser(userId, id);
    return Response.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cuidado não encontrado";
    return Response.json({ error: message }, { status: 404 });
  }
}
