import { Redirect } from "expo-router";

// O menu de Perfil virou o painel lateral (ProfileDrawer, aberto pelo
// toque na aba — ver (tabs)/_layout.tsx). Essa rota só existe porque o
// Stack aninhado precisa de uma tela inicial; se for alcançada de algum
// jeito (link direto, etc), volta pro Início.
export default function PerfilIndexScreen() {
  return <Redirect href="/" />;
}
