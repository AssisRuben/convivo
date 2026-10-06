import { getApiUserId } from "@/lib/apiAuth";
import { getMedicationSuggestionsForUser } from "@/lib/medications/medicationSuggestions";

/** Remédios das compras da pessoa, pra sugerir no cadastro. */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const suggestions = await getMedicationSuggestionsForUser(userId);
    return Response.json({ suggestions });
  } catch {
    // Sugestão é ajuda, não requisito — o cadastro funciona só com o nome.
    return Response.json({ suggestions: [] });
  }
}
