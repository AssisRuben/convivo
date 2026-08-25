import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { ApiCatalogItem } from "@/lib/api";
import { ProductImage } from "@/components/catalog/ProductImage";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Seção da vitrine — cabeçalho + FlatList horizontal. Sem componente
 * parecido existindo antes no app (telas de lista aqui sempre foram
 * verticais); dimensionamento e paleta seguem os cards já usados em
 * catalogo.tsx/carrinho.tsx (rounded-2xl bg-card shadow-sm, navy/cream).
 */
export function ProductCarousel({
  title,
  items,
  onSeeAll,
}: {
  title: string;
  items: ApiCatalogItem[];
  onSeeAll?: () => void;
}) {
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center justify-between px-4">
        <Text className="text-base font-bold text-navy">{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text className="text-xs font-medium text-mint">Ver mais →</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => String(item.codigo)}
        contentContainerClassName="gap-3 px-4"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/produto/${item.codigo}`)}
            className="w-32 rounded-2xl bg-card p-2.5 shadow-sm"
          >
            <ProductImage
              key={item.imageUrl}
              uri={item.imageUrl}
              category={item.category}
              className="h-24 w-full rounded-xl"
            />
            <Text numberOfLines={2} className="mt-2 text-xs font-medium text-navy">
              {item.name}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-navy">{formatPrice(item.priceCents)}</Text>
            {item.stock <= 0 && <Text className="text-[10px] text-coral">Esgotado</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}
