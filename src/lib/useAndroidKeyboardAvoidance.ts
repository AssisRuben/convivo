import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * No Android, o Expo tornou o edge-to-edge obrigatório (SDK 54+), o que
 * quebra o contrato nativo do `adjustResize`/`adjustPan` — o teclado passa
 * a cobrir o campo focado em vez de empurrar a tela, e nem o
 * `KeyboardAvoidingView` do React Native (que depende desse resize pra
 * detectar a altura do teclado) consegue compensar. `react-native-avoid-
 * softinput` resolve reagindo ao inset do teclado nativamente — mas o uso
 * recomendado pela própria lib é ativar por tela (no foco) e desativar ao
 * sair, não uma ativação global única na raiz do app: um `setEnabled(true)`
 * chamado uma vez só, bem antes de qualquer TextInput existir, não
 * funcionava de verdade (confirmado batendo no app real — nem a própria
 * tela de login, o motivo de existir essa lib, ficava livre do teclado
 * cobrindo o botão "Entrar").
 *
 * Import dinâmico + guarda de Expo Go pelo mesmo motivo do
 * expo-notifications: o módulo nativo não existe lá (só funciona em
 * development build / build de verdade), e no iOS o KeyboardAvoidingView
 * de cada tela já funciona bem sozinho, então nem precisa entrar aqui.
 *
 * Chame dentro de cada tela com TextInput que precisa desse tratamento no
 * Android (login, cadastro, formulários de perfil, checkout, etc).
 */
export function useAndroidKeyboardAvoidance() {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

      let cancelled = false;
      import("react-native-avoid-softinput").then(({ AvoidSoftInput }) => {
        if (!cancelled) AvoidSoftInput.setEnabled(true);
      });

      return () => {
        cancelled = true;
        import("react-native-avoid-softinput").then(({ AvoidSoftInput }) => {
          AvoidSoftInput.setEnabled(false);
        });
      };
    }, [])
  );
}
