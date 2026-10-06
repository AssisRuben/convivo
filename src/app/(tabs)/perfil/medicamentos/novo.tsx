import { useRouter } from "expo-router";
import { apiFetch } from "@/lib/api";
import { invalidateCached } from "@/lib/tabDataCache";
import { HOME_CACHE_KEY, ROTINA_CACHE_KEY } from "@/lib/tabPrefetch";
import { MedicationForm } from "@/components/MedicationForm";

/**
 * Cadastro manual de remédio — nome digitado, sem compra no histórico
 * (comprado em outro lugar, ou antes de usar o app). Sem código de
 * produto, então não tem recompra rápida; o resto (lembretes, Home,
 * previsão de quando acaba) funciona igual.
 */
export default function NovoMedicamentoScreen() {
  const router = useRouter();

  return (
    <MedicationForm
      productName=""
      editableName
      initial={{}}
      submitLabel="Salvar e ativar lembretes"
      onSubmit={async (values) => {
        const res = await apiFetch("/api/mobile/medicamentos", {
          method: "POST",
          body: JSON.stringify({ ...values, codigoProduto: null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
        invalidateCached(HOME_CACHE_KEY);
        invalidateCached(ROTINA_CACHE_KEY);
        router.replace("/perfil/medicamentos");
      }}
    />
  );
}
