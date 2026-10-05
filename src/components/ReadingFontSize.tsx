import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getItemAsync, setItemAsync } from "@/lib/storage";

/**
 * Tamanho da letra nas telas de leitura (Pílulas de sabedoria e Gotas de
 * Fé). Uma preferência só pras duas, salva no aparelho. O valor fica
 * também num cache de módulo, pra trocar de capítulo não piscar no tamanho
 * padrão enquanto lê do armazenamento.
 */
const STORAGE_KEY = "convivo_reading_font_scale";
export const READING_FONT_SCALES = [1, 1.15, 1.3, 1.5, 1.7];

let cachedIndex: number | null = null;
const listeners = new Set<(index: number) => void>();

function setSharedIndex(index: number) {
  cachedIndex = index;
  listeners.forEach((l) => l(index));
  setItemAsync(STORAGE_KEY, String(index)).catch(() => {});
}

export function useReadingFontScale() {
  const [index, setIndex] = useState(() => cachedIndex ?? 0);

  useEffect(() => {
    listeners.add(setIndex);
    if (cachedIndex === null) {
      getItemAsync(STORAGE_KEY)
        .then((stored) => {
          const parsed = Number(stored);
          const valid = Number.isInteger(parsed) && parsed >= 0 && parsed < READING_FONT_SCALES.length;
          cachedIndex = valid ? parsed : 0;
          setIndex(cachedIndex);
        })
        .catch(() => {});
    }
    return () => {
      listeners.delete(setIndex);
    };
  }, []);

  return {
    scale: READING_FONT_SCALES[index],
    canDecrease: index > 0,
    canIncrease: index < READING_FONT_SCALES.length - 1,
    decrease: () => setSharedIndex(Math.max(0, index - 1)),
    increase: () => setSharedIndex(Math.min(READING_FONT_SCALES.length - 1, index + 1)),
  };
}

/** Botões A− / A+ pro topo da leitura. */
export function ReadingFontSizeControl({
  canDecrease,
  canIncrease,
  decrease,
  increase,
}: {
  canDecrease: boolean;
  canIncrease: boolean;
  decrease: () => void;
  increase: () => void;
}) {
  return (
    <View className="flex-row items-center self-end overflow-hidden rounded-full border border-navy/10 bg-card">
      <Pressable
        onPress={decrease}
        disabled={!canDecrease}
        accessibilityLabel="Diminuir letra"
        hitSlop={6}
        className={`px-3.5 py-1.5 ${canDecrease ? "" : "opacity-30"}`}
      >
        <Text className="text-sm font-bold text-navy">A−</Text>
      </Pressable>
      <View className="h-5 w-px bg-navy/10" />
      <Pressable
        onPress={increase}
        disabled={!canIncrease}
        accessibilityLabel="Aumentar letra"
        hitSlop={6}
        className={`px-3.5 py-1.5 ${canIncrease ? "" : "opacity-30"}`}
      >
        <Text className="text-lg font-bold text-navy">A+</Text>
      </Pressable>
    </View>
  );
}
