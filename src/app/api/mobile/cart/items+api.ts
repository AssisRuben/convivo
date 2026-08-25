import { getApiUserId } from "@/lib/apiAuth";
import { addCartItem, getOrCreateCart } from "@/lib/cart";
import { getCatalogProductByCodigo } from "@/lib/catalog/catalogDb";
import { mirrorCatalogProduct } from "@/lib/catalog/catalogMirror";

export async function POST(request: Request) {
  const userId = await getApiUserId(request);
  if (!userId) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const codigoProduto = Number(body?.codigoProduto);
  const quantity = Number(body?.quantity ?? 1);

  if (!Number.isFinite(codigoProduto) || !Number.isFinite(quantity) || quantity < 1) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Busca ao vivo em vez de confiar cegamente no id — antes disso, um
  // productId inválido só era pego pela FK do banco (erro cru, não
  // tratado); agora existe validação de existência/elegibilidade de
  // verdade antes de qualquer escrita.
  const catalogProduct = await getCatalogProductByCodigo(codigoProduto);
  if (!catalogProduct) {
    return Response.json({ error: "Produto não encontrado ou indisponível" }, { status: 404 });
  }

  const mirrored = await mirrorCatalogProduct(catalogProduct);
  await addCartItem(userId, mirrored.id, quantity);
  const cart = await getOrCreateCart(userId);
  return Response.json({ cart });
}
