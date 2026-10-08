/**
 * Importa capítulos de leitura (Pílulas de sabedoria / Gotas de Fé) de um
 * CSV no formato da tabela ReadingChapter — colunas
 * id,bookSlug,number,title,subtitle,blocks,updatedAt (blocks = JSON) — e
 * cria/atualiza o livro. Valida tudo antes de gravar; regravar é seguro
 * (upsert por livro + número).
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/import-reading-csv.ts \
 *     --file=assets/ReadingChapter_Lucas_ExactHeaders.csv --slug=lucas --kind=FAITH \
 *     --title="Evangelho de Lucas" --subtitle="..." --icon=heart --color=#f59e0b --order=2 [--dry-run]
 */
import fs from "node:fs";
import { prisma } from "../src/lib/prisma";

const BLOCK_TYPES = new Set(["heading", "paragraph", "quote", "list", "footnote"]);

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}

/** CSV (RFC 4180): aspas, "" escapado, vírgula e quebra de linha dentro de aspas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.length > 0)) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.length > 0)) rows.push(row);
  }
  return rows;
}

function validateBlocks(blocks: unknown, where: string): void {
  if (!Array.isArray(blocks) || blocks.length === 0) throw new Error(`${where}: blocks vazio ou não é lista`);
  blocks.forEach((b, i) => {
    const block = b as Record<string, unknown>;
    if (!BLOCK_TYPES.has(String(block.type))) throw new Error(`${where}, bloco ${i}: tipo "${block.type}" inválido`);
    if (block.type === "list") {
      if (!Array.isArray(block.items) || block.items.some((it) => typeof it !== "string" || !it.trim()))
        throw new Error(`${where}, bloco ${i}: lista sem itens de texto`);
    } else if (typeof block.text !== "string" || !block.text.trim()) {
      throw new Error(`${where}, bloco ${i}: sem texto`);
    }
  });
}

async function main() {
  const file = arg("file");
  const slug = arg("slug");
  const kind = arg("kind");
  const title = arg("title");
  const subtitle = arg("subtitle");
  const icon = arg("icon");
  const color = arg("color");
  const order = Number(arg("order") ?? "0");
  const dryRun = process.argv.includes("--dry-run");
  if (!file || !slug || (kind !== "FAITH" && kind !== "WISDOM") || !title || !subtitle || !icon || !color) {
    throw new Error("Faltam parâmetros (veja o comentário no topo do script)");
  }

  const [header, ...rows] = parseCsv(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`CSV sem a coluna ${name}`);
    return i;
  };
  const [iSlug, iNumber, iTitle, iSubtitle, iBlocks] = ["bookSlug", "number", "title", "subtitle", "blocks"].map(col);

  const chapters = rows.map((r, idx) => {
    const where = `linha ${idx + 2}`;
    if (r[iSlug] !== slug) throw new Error(`${where}: bookSlug "${r[iSlug]}" diferente de --slug=${slug}`);
    const number = Number(r[iNumber]);
    if (!Number.isInteger(number) || number < 1) throw new Error(`${where}: número de capítulo inválido`);
    if (!r[iTitle]?.trim()) throw new Error(`${where}: sem título`);
    let blocks: unknown;
    try {
      blocks = JSON.parse(r[iBlocks]);
    } catch {
      throw new Error(`${where}: blocks não é JSON válido`);
    }
    validateBlocks(blocks, `${where} (capítulo ${number})`);
    return { number, title: r[iTitle].trim(), subtitle: (r[iSubtitle] ?? "").trim(), blocks: blocks as object[] };
  });

  const numbers = chapters.map((c) => c.number).sort((a, b) => a - b);
  numbers.forEach((n, i) => {
    if (n !== i + 1) throw new Error(`Capítulos devem ir de 1 a ${chapters.length} sem buraco nem repetição (achei ${numbers.join(",")})`);
  });

  const blockCount = chapters.reduce((sum, c) => sum + c.blocks.length, 0);
  console.log(`${slug}: ${chapters.length} capítulos, ${blockCount} blocos — tudo válido.`);
  console.log(`  1. ${chapters[0].title}`);
  console.log(`  ${chapters.length}. ${chapters[chapters.length - 1].title}`);
  if (dryRun) {
    console.log("(dry-run: nada gravado)");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.readingBook.upsert({
      where: { slug },
      create: { slug, kind, title, subtitle, icon, color, sortOrder: order, active: true },
      update: { kind, title, subtitle, icon, color, sortOrder: order },
    });
    for (const c of chapters) {
      await tx.readingChapter.upsert({
        where: { bookSlug_number: { bookSlug: slug, number: c.number } },
        create: { bookSlug: slug, number: c.number, title: c.title, subtitle: c.subtitle, blocks: c.blocks },
        update: { title: c.title, subtitle: c.subtitle, blocks: c.blocks },
      });
    }
  }, { timeout: 60000 });
  console.log("Gravado.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("ERRO:", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
