import { getItemAsync } from "@/lib/storage";
import { TOKEN_KEY } from "@/lib/storageKeys";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

/**
 * Wrapper de fetch centralizado — injeta o token JWT salvo (se houver) em
 * todo request. Usado por todas as telas que falam com o backend próprio
 * do app (rotas `+api.ts` do Expo Router, em src/app/api/mobile/**).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getItemAsync(TOKEN_KEY);

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
  authorName?: string;
  shareState?: "shareable" | "shared";
  /** Presente em posts de notícia: link pra matéria original. */
  sourceUrl?: string;
  /** Presentes só em conquistas de meta em escada (peso/rotina). */
  goalType?: "PESO" | "ROTINA";
  milestoneValue?: number;
  stage?: number;
};

export type ApiFeedPage = {
  items: ApiFeedItem[];
  hasMore: boolean;
};

export type ApiProfile = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  birthDate: string | null;
  cep: string | null;
  estado: string | null;
  cidade: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  complemento: string | null;
  heightCm: number | null;
  conditions: string[];
  allergies: string[];
};

export type ProfileInput = Partial<Omit<ApiProfile, "id" | "email">>;

export type ApiCareCategory =
  | "TREINO"
  | "ALIMENTACAO"
  | "ESTUDOS"
  | "MEDICACAO"
  | "TERAPIA"
  | "OUTRO";

export type ApiChecklistItem = {
  id: string;
  title: string;
  category: ApiCareCategory;
  timeOfDay: string | null;
  daysOfWeek: number[];
  completedToday: boolean;
};

export type RoutineItemInput = {
  title: string;
  category: ApiCareCategory;
  timeOfDay?: string | null;
  daysOfWeek: number[];
};
