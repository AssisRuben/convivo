import { createContext, useContext, useState, type ReactNode } from "react";

type ProfileDrawerState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const ProfileDrawerContext = createContext<ProfileDrawerState | null>(null);

/**
 * Estado global do drawer de Perfil — precisa viver acima da navegação
 * (Tabs), não dentro da aba, porque o drawer é um overlay que aparece por
 * cima de qualquer aba (Início, Catálogo, etc), não uma tela navegada.
 */
export function ProfileDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ProfileDrawerContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </ProfileDrawerContext.Provider>
  );
}

export function useProfileDrawer(): ProfileDrawerState {
  const ctx = useContext(ProfileDrawerContext);
  if (!ctx) throw new Error("useProfileDrawer precisa estar dentro de <ProfileDrawerProvider>");
  return ctx;
}
