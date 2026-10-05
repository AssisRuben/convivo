import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "@/lib/api";
import { MedicationForm } from "@/components/MedicationForm";

export default function ConfigurarMedicamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    nomeProduto: string;
    codigoProduto: string;
    dataEmissao: string;
    quantidade: string;
  }>();

  return (
    <MedicationForm
      productName={params.nomeProduto}
      initial={{ totalUnits: params.quantidade ? Number(params.quantidade) : null }}
      submitLabel="Salvar e ativar lembretes"
      onSubmit={async (values) => {
        const res = await apiFetch("/api/mobile/medicamentos", {
          method: "POST",
          body: JSON.stringify({
            productName: params.nomeProduto,
            codigoProduto: params.codigoProduto ? Number(params.codigoProduto) : null,
            purchaseDate: params.dataEmissao,
            ...values,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
        router.replace("/perfil/medicamentos");
      }}
    />
  );
}
