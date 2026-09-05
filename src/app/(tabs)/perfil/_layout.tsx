import { Stack } from "expo-router";
import { BackHeaderButton, brandHeaderOptions } from "@/components/AppHeader";

// Restaura a seta de voltar explícita (mesmo motivo/mesmo componente de
// produto/categoria em app/_layout.tsx) pras telas alcançadas por um
// SEGUNDO toque, não direto do menu — ex: histórico de compras → configurar
// medicamento. Pra essas, tocar de novo na aba Perfil só reabre o menu, não
// volta pra tela anterior, e sem seta nenhuma o usuário fica sem saída
// visível (achado testando: histórico → configurar medicamento não tinha
// como voltar).
const backButtonOptions = { headerBackVisible: true, headerLeft: BackHeaderButton };

/**
 * Stack aninhado dentro da aba Perfil — Meus dados, Pedidos, Minhas
 * postagens e Indicação continuam "dentro" da aba (a barra de baixo não
 * some) em vez de empilhar por cima dela. Essas (abertas direto do menu)
 * seguem sem seta de voltar (padrão do brandHeaderOptions): tocar de novo
 * na aba Perfil já volta pro menu.
 */
export default function PerfilLayout() {
  return (
    <Stack screenOptions={brandHeaderOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="meus-dados" />
      <Stack.Screen name="pedidos" />
      <Stack.Screen name="pedidos/[id]" options={backButtonOptions} />
      <Stack.Screen name="minhas-postagens" />
      <Stack.Screen name="fidelidade" />
      <Stack.Screen name="indicacao" />
      <Stack.Screen name="historico-compras" />
      <Stack.Screen name="medicamentos/index" />
      <Stack.Screen name="medicamentos/configurar" options={backButtonOptions} />
      <Stack.Screen name="medicamentos/[id]/recomprar" options={backButtonOptions} />
      <Stack.Screen name="metas/index" />
      <Stack.Screen name="metas/nova" options={backButtonOptions} />
      <Stack.Screen name="metas/[id]" options={backButtonOptions} />
    </Stack>
  );
}
