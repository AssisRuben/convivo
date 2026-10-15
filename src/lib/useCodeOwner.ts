import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type CodeOwnerState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "found"; name: string; kind: "amigo" | "vendedor" }
  | { status: "notfound" };

const MIN_LENGTH = 4;

type Resolved = Exclude<CodeOwnerState, { status: "checking" }>;

/**
 * De quem é o código digitado ("Código de Maria S."), consultando o
 * servidor meio segundo depois que a pessoa para de digitar. "Conferindo"
 * é derivado: o código mudou e a resposta dele ainda não chegou.
 */
export function useCodeOwner(rawCode: string): CodeOwnerState {
  const code = rawCode.replace(/\s+/g, "").toUpperCase();
  const [resolved, setResolved] = useState<{ code: string; result: Resolved } | null>(null);

  useEffect(() => {
    if (code.length < MIN_LENGTH) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      let result: Resolved = { status: "idle" };
      try {
        const res = await apiFetch(`/api/mobile/codigo/${encodeURIComponent(code)}`);
        if (!res.ok) result = { status: "notfound" };
        else {
          const owner = await res.json();
          result = { status: "found", name: owner.name, kind: owner.kind };
        }
      } catch {
        // sem rede: não afirma nada
      }
      if (!cancelled) setResolved({ code, result });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  if (code.length < MIN_LENGTH) return { status: "idle" };
  if (resolved?.code !== code) return { status: "checking" };
  return resolved.result;
}
