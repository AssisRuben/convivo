import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "@/lib/api";
import { MedicationForm } from "@/components/MedicationForm";
import { invalidateCached } from "@/lib/tabDataCache";
import { HOME_CACHE_KEY, ROTINA_CACHE_KEY } from "@/lib/tabPrefetch";
import { unitsPerPackageFromName } from "@/lib/medications/packageCount";

/**
 * Configurar remédio a partir de uma compra do histórico. `quantidade` é
 * o número de CAIXAS da compra — vira a quantidade da recompra; os
 * comprimidos são sugeridos pelo nome ("120CAP" × caixas). Antes as caixas
 * iam direto como comprimidos (frasco de 120 cápsulas virava "1").
 */
export default function ConfigurarMedicamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    nomeProduto: string;
    codigoProduto: string;
    dataEmissao: string;
    quantidade: string;
  }>();
  const packQuantity = Math.max(Math.round(Number(params.quantidade) || 1), 1);
  const perPack = unitsPerPackageFromName(params.nomeProduto ?? "");
  const suggestedUnits = perPack ? perPack * packQuantity : null;

  return (
    <MedicationForm
      productName={params.nomeProduto}
      initial={{ totalUnits: suggestedUnits }}
      unitsHint={
        suggestedUnits
          ? `Sugestão pela sua compra (${packQuantity} caixa${packQuantity > 1 ? "s" : ""}). Ajuste se já tomou alguns.`
          : undefined
      }
      submitLabel="Salvar e ativar lembretes"
      onSubmit={async (values) => {
        const res = await apiFetch("/api/mobile/medicamentos", {
          method: "POST",
          body: JSON.stringify({
            productName: params.nomeProduto,
            codigoProduto: params.codigoProduto ? Number(params.codigoProduto) : null,
            purchaseDate: params.dataEmissao,
            packQuantity,
            ...values,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar");
        // As doses novas aparecem na Home e na Rotina na próxima vez que
        // elas ganharem foco.
        invalidateCached(HOME_CACHE_KEY);
        invalidateCached(ROTINA_CACHE_KEY);
        router.replace("/perfil/medicamentos");
      }}
    />
  );
}
