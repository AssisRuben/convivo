import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { id }: Record<string, string>) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return Response.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  return Response.json({ product });
}
