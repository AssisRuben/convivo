import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { apiFetch, type ApiCatalogItem } from "@/lib/api";
import { ProductImage } from "@/components/catalog/ProductImage";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CategoriaScreen() {
  const router = useRouter();
  const { slug, label } = useLocalSearchParams<{ slug: string; label?: string }>();
  const [products, setProducts] = useState<ApiCatalogItem[]>([]);
  const [title, setTitle] = useState(label ?? "Categoria");
  const [loading, setLoading] = useState(true);
  // Guarda o slug já carregado, não só "já carregou uma vez" — voltar de
  // um /produto/[codigo] não deve recarregar (perde a rolagem à toa),
  // mas trocar de categoria (mesma rota, slug diferente) precisa buscar
  // de novo.
  const loadedSlugRef = useRef<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/api/mobile/catalog/categoria/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products ?? []);
        if (data.label) setTitle(data.label);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      if (loadedSlugRef.current === slug) return;
      loadedSlugRef.current = slug;
      load();
    }, [slug, load])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.codigo)}
        contentContainerClassName="gap-3 p-4 pb-24"
        ListHeaderComponent={<Text className="mb-1 text-xl font-bold text-navy">{title}</Text>}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-navy/60">Nenhum produto nessa categoria agora.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/produto/${item.codigo}`)}
            className="flex-row gap-3 rounded-2xl bg-card p-3 shadow-sm"
          >
            <ProductImage
              key={item.imageUrl}
              uri={item.imageUrl}
              category={item.category}
              className="h-16 w-16 rounded-xl"
            />
            <View className="flex-1 justify-center">
              <Text className="font-semibold text-navy">{item.name}</Text>
              <Text className="mt-1 font-semibold text-navy">{formatPrice(item.priceCents)}</Text>
              {item.stock <= 0 && <Text className="text-xs text-coral">Esgotado</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
