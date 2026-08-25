import { z } from "zod";
import { getApiUserId } from "@/lib/apiAuth";
import { attributeCode } from "@/lib/userAccount";

const schema = z.object({ code: z.string().trim().min(1, "Informe um código") });

/**
 * Vincula um código de amigo ou de vendedor depois do cadastro — mesmo
 * campo único, a detecção de qual tipo é decidida em attributeCode() pelo
 * dono do código. Usado por quem se cadastrou sem código e depois quer
 * vincular um amigo, ou é atendido por um vendedor na farmácia.
 */
export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const result = await attributeCode(userId, parsed.data.code);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json({ ok: true, kind: result.kind });
}
