import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getItemAsync, setItemAsync } from "@/lib/storage";

function storageKey(userId: string): string {
  return `convivo.onboarding.completed.${userId}`;
}

/**
 * Controla se o tour de boas-vindas deve aparecer — uma vez por conta,
 * flag salva localmente (mesmo storage do token, ver storage.ts) assim que
 * o usuário conclui ou pula. Checa de novo a cada troca de usuário (login
 * de outra conta no mesmo aparelho não deve herdar o "já visto" de outra).
 */
export function useOnboardingTourVisibility() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    getItemAsync(storageKey(user.id)).then((done) => {
      if (!cancelled) setVisible(!done);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (user) setItemAsync(storageKey(user.id), "1");
  }, [user]);

  return { visible, dismiss };
}
