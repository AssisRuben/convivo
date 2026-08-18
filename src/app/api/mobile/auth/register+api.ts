import { z } from "zod";
import { createUserAccount } from "@/lib/userAccount";
import { signMobileToken } from "@/lib/mobileAuth";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  referralCode: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const result = await createUserAccount(parsed.data);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  const token = await signMobileToken(result.user.id);
  return Response.json({
    token,
    user: { id: result.user.id, name: result.user.name, email: result.user.email },
  });
}
