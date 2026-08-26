import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import type { ApiCatalogCategorySlug } from "@/lib/api";

const STORAGE_KEY = "convivo.cart.v1";

export type LocalCartItem = {
  codigoProduto: number;
  name: string;
  priceCents: number;
  imageUrl: string;
  category: ApiCatalogCategorySlug;
  stock: number;
  quantity: number;
};

type CartState = {
  items: LocalCartItem[];
  count: number;
  totalCents: number;
  addItem: (product: Omit<LocalCartItem, "quantity">, quantity?: number) => void;
  setQuantity: (codigoProduto: number, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

/**
 * Carrinho vive só no dispositivo (AsyncStorage) enquanto está sendo
 * montado — nenhum toque de +/-/adicionar fala com o servidor, só
 * "Finalizar pedido" manda a lista inteira de uma vez (ver carrinho.tsx).
 * O travamento de estoque de verdade continua só no servidor, na criação
 * do pedido (createOrderForItems) — nunca dependeu do carrinho em si.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const hadTokenRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    // Só grava depois de ler o que já existia — sem esse guard, o efeito
    // de salvar roda no mount com items=[] antes do de carregar terminar,
    // e sobrescreve o carrinho salvo com vazio.
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  useEffect(() => {
    // Limpa ao deslogar de verdade (token vai de presente pra ausente) —
    // não no primeiro render (token começa null até o restore terminar),
    // senão apagaria o carrinho salvo antes mesmo de saber se tem sessão.
    if (token) {
      hadTokenRef.current = true;
    } else if (hadTokenRef.current) {
      hadTokenRef.current = false;
      setItems([]);
    }
  }, [token]);

  function addItem(product: Omit<LocalCartItem, "quantity">, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.codigoProduto === product.codigoProduto);
      if (existing) {
        return prev.map((i) =>
          i.codigoProduto === product.codigoProduto
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }

  function setQuantity(codigoProduto: number, quantity: number) {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.codigoProduto !== codigoProduto);
      return prev.map((i) => (i.codigoProduto === codigoProduto ? { ...i, quantity } : i));
    });
  }

  function clear() {
    setItems([]);
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, totalCents, addItem, setQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
