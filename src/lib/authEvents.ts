// Ponte entre api.ts (fora de React, não pode usar useAuth) e o logout de
// verdade em auth.tsx (limpa storage + estado em memória) — evita import
// circular entre os dois (auth.tsx já importa apiFetch de api.ts).
type ForceLogoutHandler = () => void;

let handler: ForceLogoutHandler | null = null;

export function registerForceLogoutHandler(fn: ForceLogoutHandler): void {
  handler = fn;
}

export function triggerForceLogout(): void {
  handler?.();
}
