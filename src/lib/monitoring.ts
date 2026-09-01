import * as Sentry from "@sentry/react-native";

// EXPO_PUBLIC_ porque roda no cliente (RN), não numa rota de API — mesma
// regra do resto do Expo pra variável acessível no bundle. Sem ela, o app
// funciona normal, só sem relatório de crash — mesmo espírito de
// graceful degradation de mercadopago.ts/trier.ts/productImage.ts.
//
// Só a metade JS aqui (Sentry.init + ErrorBoundary): a outra metade —
// symbolication de verdade (source maps enviados no build) e o wizard
// (`npx @sentry/wizard -i reactNative`) que mexe no metro.config.js —
// fica pra quem for configurar a conta Sentry de verdade, porque essa
// parte exige login interativo (não dá pra rodar daqui) e mexe num
// arquivo que já teve um crash nativo real ligado a config errada
// (ver comentário em metro.config.js) — não vale o risco sem poder testar.
export function isSentryConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN);
}

export function initMonitoring(): void {
  if (!isSentryConfigured()) return;

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enabled: !__DEV__,
  });
}

export { Sentry };
