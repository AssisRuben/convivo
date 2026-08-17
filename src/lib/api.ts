import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY } from "@/lib/storageKeys";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

/**
 * Wrapper de fetch centralizado — injeta o token JWT salvo (se houver) em
 * todo request. Usado por todas as telas que falam com a API do
 * pagamentoapp (backend Next.js/Vercel).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export type ApiProduct = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
};

export type ApiCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: ApiProduct;
};

export type ApiCart = {
  id: string;
  items: ApiCartItem[];
};

export type ApiFeedComment = {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
};

export type ApiFeedItem = {
  id: string;
  itemKey: string;
  kind: "achievement" | "content";
  title: string;
  message: string;
  extra: string;
  imageUrl?: string | null;
  dateLabel: string;
  liked: boolean;
  likeCount: number;
  comments: ApiFeedComment[];
};

export type ApiFeedPage = {
  items: ApiFeedItem[];
  hasMore: boolean;
};
