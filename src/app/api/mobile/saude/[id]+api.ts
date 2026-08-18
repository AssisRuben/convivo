import { getApiUserId } from "@/lib/apiAuth";
import {
  deleteMeasurementForUser,
  listMeasurementsForUser,
  updateMeasurementForUser,
  type HealthMeasurementValues,
} from "@/lib/health/healthCore";

export async function PATCH(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const values: Omit<HealthMeasurementValues, "type"> = {
    ...body,
    measuredAt: new Date(body.measuredAt),
  };

  try {
    await updateMeasurementForUser(userId, id, values);
    const measurements = await listMeasurementsForUser(userId);
    return Response.json({ measurements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deleteMeasurementForUser(userId, id);
    const measurements = await listMeasurementsForUser(userId);
    return Response.json({ measurements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover";
    return Response.json({ error: message }, { status: 400 });
  }
}
