import { useEffect, useState } from "react";
import { getCached, setCached } from "@/lib/tabDataCache";

/**
 * Estado que lembra o último valor da tela (na memória do app, por
 * sessão de login — limpo ao trocar de conta). Voltar pra tela mostra o
 * que já tinha na hora, sem spinner, e a busca de sempre atualiza por trás.
 */
export function useCachedState<T>(key: string) {
  const [value, setValue] = useState<T | null>(() => getCached<T>(key) ?? null);
  useEffect(() => {
    if (value != null) setCached(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}
