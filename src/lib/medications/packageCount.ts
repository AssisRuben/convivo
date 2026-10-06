/**
 * Comprimidos por caixa a partir do nome do produto ("OMEGA 3 120CAP" →
 * 120, "AZITROMICINA 500MG 5CP" → 5). null quando o nome não diz.
 * Pra sugerir "quantos você tem" — o histórico de compras só tem o número
 * de caixas, e usar esse número como comprimidos fazia o app achar que um
 * frasco de 120 cápsulas tinha 1.
 *
 * Módulo sem dependências de propósito: roda no servidor (sugestões) e no
 * app (pré-preenchimento), e medicationCore.ts importa o Prisma.
 */
export function unitsPerPackageFromName(name: string): number | null {
  const match = name.toUpperCase().match(/(\d+)\s*(?:CPR|COMP|CAPS|CAP|CP|DRG|UN)\b/);
  if (!match) return null;
  const n = Number(match[1]);
  return n > 0 && n <= 1000 ? n : null;
}
