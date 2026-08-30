import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text } from "react-native";
import type { ApiCatalogHome } from "@/lib/api";
import { ProductCarousel } from "@/components/catalog/ProductCarousel";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CATALOG_HOME_CACHE_KEY, fetchCatalogHome } from "@/lib/tabPrefetch";
import { getCached, loadCached, setCached } from "@/lib/tabDataCache";

export default function CatalogScreen() {
  const router = useRouter();
  const [home, setHome] = useState<ApiCatalogHome | null>(
    () => getCached<ApiCatalogHome>(CATALOG_HOME_CACHE_KEY) ?? null
  );
  const [loading, setLoading] = useState(home === null);
  const loadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Só busca uma vez — sem isso, voltar de um /produto/[codigo]
      // recarregava a vitrine inteira do zero a cada vez (perdia posição
      // de scroll, mostrava spinner de novo), já que focus dispara toda
      // vez que a aba volta a ficar em foco, não só na primeira entrada.
      if (loadedOnce.current) return;
      loadedOnce.current = true;
      if (home !== null) return; // já veio do cache/prefetch

      let cancelled = false;
      setLoading(true);
      loadCached(CATALOG_HOME_CACHE_KEY, fetchCatalogHome)
        .then((data) => {
          if (!cancelled) setHome(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Espelha o state atual no cache — pega tanto a carga inicial quanto
  // qualquer atualização futura, sem precisar sincronizar em cada lugar
  // que muda `home`.
  useEffect(() => {
    if (home !== null) setCached(CATALOG_HOME_CACHE_KEY, home);
  }, [home]);

  if (loading || !home) {
    return <LoadingScreen />;
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
