import { getApiUserId } from "@/lib/apiAuth";
import {
  addMeasurementsForUser,
  listMeasurementsForUser,
  type HealthMeasurementValues,
} from "@/lib/health/healthCore";

export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const measurements = await listMeasurementsForUser(userId);
  return Response.json({ measurements });
}

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entries = body?.entries as
    | (Omit<HealthMeasurementValues, "measuredAt"> & { measuredAt: string })[]
    | undefined;

  if (!Array.isArray(entries) || entries.length === 0) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    await addMeasurementsForUser(
      userId,
      entries.map((e) => ({ ...e, measuredAt: new Date(e.measuredAt) }))
    );
    const measurements = await listMeasurementsForUser(userId);
    return Response.json({ measurements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar";
    return Response.json({ error: message }, { status: 400 });
  }
}
