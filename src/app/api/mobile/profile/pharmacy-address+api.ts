import { getApiUserId } from "@/lib/apiAuth";
import { getProfileForUser } from "@/lib/profile/profileCore";
import { getCustomerAddressFromPharmacy } from "@/lib/pharmacyDb";

/**
 * Endereço do cadastro real na farmácia (casado por CPF/telefone), pra
 * pré-preencher o checkout — ver getCustomerAddressFromPharmacy. Só
 * leitura, nunca escreve no perfil sozinho.
 */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const profile = await getProfileForUser(userId);
  const address = await getCustomerAddressFromPharmacy(profile.cpf, profile.phone);
  return Response.json({ address });
}
