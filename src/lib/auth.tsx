import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { deleteItemAsync, getItemAsync, setItemAsync } from "@/lib/storage";
import { apiFetch } from "@/lib/api";
import { clearAllCached } from "@/lib/tabDataCache";
import { TOKEN_KEY, USER_KEY } from "@/lib/storageKeys";
import { registerPushToken, resetPushSession, unregisterPushToken } from "@/lib/push/registerPushToken";
import { clearLocalReminders } from "@/lib/reminders/localReminders";
import { registerForceLogoutHandler } from "@/lib/authEvents";

export type AuthUser = { id: string; name: string; email: string };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function extractError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null);
  return data?.error ?? fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const [storedToken, storedUser] = await Promise.all([
        getItemAsync(TOKEN_KEY),
        getItemAsync(USER_KEY),
      ]);
      if (storedToken) {
        setToken(storedToken);
        registerPushToken();
      }
      if (storedUser) setUser(JSON.parse(storedUser));
      setIsLoading(false);
    }
    restore();
  }, []);

  async function persist(newToken: string, newUser: AuthUser) {
    // Dados guardados das telas são da conta anterior: começa do zero.
    clearAllCached();
    resetPushSession();
    await Promise.all([
      setItemAsync(TOKEN_KEY, newToken),
      setItemAsync(USER_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
    registerPushToken();
  }

  async function login(email: string, password: string) {
    const res = await apiFetch("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await extractError(res, "Não foi possível entrar"));
    const data = await res.json();
    await persist(data.token, data.user);
  }

  async function register(name: string, email: string, password: string, referralCode?: string) {
    const res = await apiFetch("/api/mobile/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, referralCode: referralCode || undefined }),
    });
    if (!res.ok) throw new Error(await extractError(res, "Não foi possível criar a conta"));
    const data = await res.json();
    await persist(data.token, data.user);
  }

  async function clearSession() {
    // lembrete agendado no celular é da conta que saiu
    await clearLocalReminders();
    resetPushSession();
    clearAllCached();
    await Promise.all([
      deleteItemAsync(TOKEN_KEY),
      deleteItemAsync(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }

  async function logout() {
    // Antes de apagar o login: a rota que desliga o push exige estar logado.
    await unregisterPushToken();
    await clearSession();
  }

  useEffect(() => {
    // Sessão expirada (401): não tenta desligar o push — a chamada daria
    // 401 de novo e cairia aqui em loop. O token fica com a conta até o
    // próximo login, que troca o dono dele.
    registerForceLogoutHandler(clearSession);
  });

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
