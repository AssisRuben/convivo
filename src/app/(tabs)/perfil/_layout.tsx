import { Stack } from "expo-router";
import { brandHeaderOptions } from "@/components/AppHeader";

/**
 * Stack aninhado dentro da aba Perfil — Meus dados, Pedidos, Comunidade e
 * Indicação continuam "dentro" da aba (a barra de baixo não some) em vez
 * de empilhar por cima dela. Sem seta de voltar em nenhuma tela (padrão
 * do brandHeaderOptions): tocar de novo na aba Perfil já volta pro menu.
 */
export default function PerfilLayout() {
  return (
    <Stack screenOptions={brandHeaderOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="meus-dados" />
      <Stack.Screen name="pedidos" />
      <Stack.Screen name="pedidos/[id]" />
      <Stack.Screen name="comunidade" />
      <Stack.Screen name="indicacao" />
    </Stack>
  );
}
