import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseTime(value: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { hour: 8, minute: 0 };
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function Column({
  values,
  selected,
  onSelect,
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  // Centraliza o valor selecionado ao abrir — o padding de 2 itens em cima
  // e embaixo deixa o primeiro/último valor chegar no meio da coluna.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selected * ITEM_HEIGHT, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const padding = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 84 }}>
      <View
        pointerEvents="none"
        className="absolute inset-x-0 rounded-xl bg-navy/5"
        style={{ top: padding, height: ITEM_HEIGHT }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: padding }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const value = values[Math.min(Math.max(index, 0), values.length - 1)];
          if (value !== selected) onSelect(value);
        }}
        onScrollEndDrag={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const value = values[Math.min(Math.max(index, 0), values.length - 1)];
          if (value !== selected) onSelect(value);
        }}
      >
        {values.map((v) => (
          <Pressable
            key={v}
            onPress={() => {
              onSelect(v);
              scrollRef.current?.scrollTo({ y: v * ITEM_HEIGHT, animated: true });
            }}
            style={{ height: ITEM_HEIGHT }}
            className="items-center justify-center"
          >
            <Text
              className={
                v === selected ? "text-2xl font-bold text-navy" : "text-lg text-navy/30"
              }
            >
              {pad(v)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function TimePickerModal({
  visible,
  value,
  optional,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  value: string;
  optional: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const initial = parseTime(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-xs items-center gap-4 rounded-3xl bg-card p-5">
          <Text className="text-base font-bold text-navy">Escolha o horário</Text>
          <Text className="text-4xl font-extrabold text-coral">
            {pad(hour)}:{pad(minute)}
          </Text>

          <View className="flex-row items-center gap-1">
            <Column values={HOURS} selected={hour} onSelect={setHour} />
            <Text className="text-2xl font-bold text-navy">:</Text>
            <Column values={MINUTES} selected={minute} onSelect={setMinute} />
          </View>

          <View className="w-full flex-row gap-2">
            {optional && value !== "" && (
              <Pressable
                onPress={() => onConfirm("")}
                className="items-center justify-center rounded-xl bg-navy/5 px-3 py-3"
              >
                <Text className="text-sm font-medium text-navy/70">Limpar</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl bg-navy/5 py-3"
            >
              <Text className="text-sm font-medium text-navy/70">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(`${pad(hour)}:${pad(minute)}`)}
              className="flex-1 items-center justify-center rounded-xl bg-coral py-3"
            >
              <Text className="text-sm font-bold text-white">Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Campo de horário que abre um seletor em modal (roda de horas e minutos)
 * em vez de digitar "HH:mm" à mão — formato sempre válido, sem teclado.
 * `value` vazio = sem horário; com `optional` aparece o botão "Limpar".
 */
export function TimeField({
  value,
  onChange,
  placeholder = "Escolher horário",
  optional = false,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between rounded-xl border border-navy/10 p-3 ${className}`}
      >
        <Text className={value ? "text-navy" : "text-navy/40"}>{value || placeholder}</Text>
        <Ionicons name="time-outline" size={18} color="#0b1e3d80" />
      </Pressable>
      <TimePickerModal
        // key força reabrir com o valor atual em vez de lembrar o último rascunho
        key={open ? "open" : "closed"}
        visible={open}
        value={value}
        optional={optional}
        onClose={() => setOpen(false)}
        onConfirm={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </>
  );
}
