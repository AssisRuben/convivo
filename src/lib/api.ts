import { Platform } from "react-native";
import { router } from "expo-router";
import { getItemAsync } from "@/lib/storage";
import { TOKEN_KEY } from "@/lib/storageKeys";
import { triggerForceLogout } from "@/lib/authEvents";

// No web, a página e a API sempre são servidas pelo mesmo processo Metro —
// usar path relativo garante same-origin não importa em qual host/porta o
// navegador abriu a página, evitando o CORS que EXPO_PUBLIC_API_URL (fixo
// no IP de LAN, pensado pro Expo Go num celular físico) causaria se
// apontasse pra um host diferente do que serviu a página.
const API_URL = Platform.OS === "web" ? "" : process.env.EXPO_PUBLIC_API_URL!;

/**
 * Wrapper de fetch centralizado — injeta o token JWT salvo (se houver) em
 * todo request. Usado por todas as telas que falam com o backend próprio
 * do app (rotas `+api.ts` do Expo Router, em src/app/api/mobile/**).
 *
 * Toda tela chama `res.json()` direto na resposta sem checar `res.ok` —
 * um 401 (token inválido/expirado, ex: segredo do JWT trocado) virava
 * `undefined` nos campos esperados e quebrava o componente ("Cannot read
 * properties of undefined"). Tratado aqui uma vez só: 401 limpa a sessão
 * guardada e manda pro login, em vez de cada tela precisar checar.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getItemAsync(TOKEN_KEY);

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    triggerForceLogout();
    router.replace("/login");
  }

  return res;
}

export type ApiCatalogCategorySlug =
  | "FRALDAS"
  | "HIGIENE_PERFUMARIA"
  | "ALIMENTACAO_INFANTIL"
  | "CONVENIENCIA"
  | "MEDICAMENTOS"
  | "OUTROS";

export type ApiCatalogItem = {
  codigo: number;
  name: string;
  priceCents: number;
  precoAnteriorCents: number | null;
  emPromocao: boolean;
  imageUrl: string;
  stock: number;
  category: ApiCatalogCategorySlug;
};

export type ApiCatalogPromoItem = ApiCatalogItem & { precoPromocionalCents: number };

export type ApiCatalogCategorySection = {
  slug: ApiCatalogCategorySlug;
  label: string;
  products: ApiCatalogItem[];
};

export type ApiCatalogHome = {
  destaques: ApiCatalogItem[];
  promocoes: ApiCatalogPromoItem[];
  categorias: ApiCatalogCategorySection[];
};

export type ApiCatalogProductDetail = ApiCatalogItem & {
  description: string | null;
  exigeReceita: boolean | null;
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
  /** Presentes só em conquistas de meta em escada (peso/rotina/indicação). */
  goalType?: "PESO" | "ROTINA" | "INDICACAO";
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

export type ApiLoyaltyProgress = {
  stampsFilled: number;
  stampsTotal: number;
  completedCycles: number;
  totalRewardCents: number;
  minOrderCents: number;
  rewardPerCycleCents: number;
};

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

export type ApiGoalMetric = "PESO" | "PRESSAO" | "ROTINA";

export type ApiGoalStatus = "ACTIVE" | "COMPLETED" | "EXPIRED";

export type ApiGoal = {
  id: string;
  metric: ApiGoalMetric;
  title: string;
  targetValue: number | null;
  baselineValue: number | null;
  startDate: string;
  endDate: string;
  status: ApiGoalStatus;
  progressRatio: number | null;
  progressLabel: string;
  daysElapsed: number;
  daysTotal: number;
  tipsSentCount: number;
};

export type ApiGoalTip = { index: number; sentAt: string; text: string };

export type ApiGoalDetail = ApiGoal & { tips: ApiGoalTip[] };

export type GoalInput = {
  metric: ApiGoalMetric;
  title: string;
  targetValue?: number | null;
  startDate: string;
  endDate: string;
  routine?: { category: ApiCareCategory; timeOfDay?: string | null; daysOfWeek: number[] };
};
