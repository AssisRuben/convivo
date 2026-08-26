import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { apiFetch, type ApiCatalogHome } from "@/lib/api";
import { ProductCarousel } from "@/components/catalog/ProductCarousel";

export default function CatalogScreen() {
  const router = useRouter();
  const [home, setHome] = useState<ApiCatalogHome | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Só busca uma vez — sem isso, voltar de um /produto/[codigo]
      // recarregava a vitrine inteira do zero a cada vez (perdia posição
      // de scroll, mostrava spinner de novo), já que focus dispara toda
      // vez que a aba volta a ficar em foco, não só na primeira entrada.
      if (loadedOnce.current) return;
      loadedOnce.current = true;

      let cancelled = false;
      setLoading(true);
      apiFetch("/api/mobile/catalog/home")
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setHome(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (loading || !home) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#0b1e3d" />
      </View>
    );
  }

  const isEmpty =
    home.destaques.length === 0 && home.promocoes.length === 0 && home.categorias.length === 0;

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-1 py-4">
      {isEmpty && (
        <Text className="mt-8 px-4 text-center text-navy/60">
          Nenhum produto disponível no catálogo agora.
        </Text>
      )}

      {home.promocoes.length > 0 && <ProductCarousel title="Promoções 🔥" items={home.promocoes} />}

      {home.destaques.length > 0 && <ProductCarousel title="Destaques" items={home.destaques} />}

      {home.categorias.map((categoria) => (
        <ProductCarousel
          key={categoria.slug}
          title={categoria.label}
          items={categoria.products}
          onSeeAll={() =>
            router.push({
              pathname: "/categoria/[slug]",
              params: { slug: categoria.slug, label: categoria.label },
            })
          }
        />
      ))}
    </ScrollView>
  );
}
