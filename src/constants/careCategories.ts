import type { ApiCareCategory } from "@/lib/api";

export const CARE_CATEGORY_META: Record<ApiCareCategory, { label: string; emoji: string }> = {
  TREINO: { label: "Treino", emoji: "💪" },
  ALIMENTACAO: { label: "Alimentação", emoji: "🍎" },
  ESTUDOS: { label: "Estudos", emoji: "📚" },
  MEDICACAO: { label: "Medicação", emoji: "💊" },
  TERAPIA: { label: "Terapia", emoji: "🧠" },
  OUTRO: { label: "Outro", emoji: "✅" },
};

export const CARE_CATEGORIES = Object.keys(CARE_CATEGORY_META) as ApiCareCategory[];

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
