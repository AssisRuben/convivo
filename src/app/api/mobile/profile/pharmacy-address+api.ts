import { getApiUserId } from "@/lib/apiAuth";
import { getProfileForUser, updateProfileForUser } from "@/lib/profile/profileCore";
import { getCustomerAddressFromPharmacy } from "@/lib/pharmacyDb";

/**
 * Endereço do cadastro real na farmácia (casado por CPF/telefone), pra
 * pré-preencher o checkout — ver getCustomerAddressFromPharmacy. Endereço
 * em si nunca é salvo por aqui (fica só na tela até o cliente confirmar
 * enviando o pedido, ver orderCore.ts); telefone é diferente — não tem
 * campo de confirmação no checkout, então só completa o perfil se ainda
 * estiver vazio (nunca sobrescreve o que o cliente já preencheu à mão em
 * Meus dados). Best-effort: se a escrita falhar, ainda devolve o endereço.
 */
export async function GET(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const profile = await getProfileForUser(userId);
  const address = await getCustomerAddressFromPharmacy(profile.cpf, profile.phone);

  if (address?.telefone && !profile.phone) {
    await updateProfileForUser(userId, { phone: address.telefone }).catch(() => {});
  }

  return Response.json({ address });
}
