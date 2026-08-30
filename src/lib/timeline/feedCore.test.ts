import { describe, expect, it } from "vitest";
import { hashSeed, seededShuffle } from "@/lib/timeline/feedCore";

describe("hashSeed", () => {
  it("é determinístico — mesma entrada sempre gera o mesmo número", () => {
    expect(hashSeed("user123-456")).toBe(hashSeed("user123-456"));
  });

  it("entradas diferentes tendem a gerar números diferentes", () => {
    expect(hashSeed("user123-456")).not.toBe(hashSeed("user456-456"));
    expect(hashSeed("user123-456")).not.toBe(hashSeed("user123-457"));
  });

  it("nunca estoura pra fora de um inteiro de 32 bits (usado como semente do PRNG)", () => {
    const hash = hashSeed("uma-string-bem-longa-pra-testar-overflow-de-verdade-mesmo");
    expect(Number.isInteger(hash)).toBe(true);
    expect(hash).toBeGreaterThanOrEqual(-(2 ** 31));
    expect(hash).toBeLessThan(2 ** 31);
  });
});

describe("seededShuffle", () => {
  it("é determinístico — mesma semente sempre produz a mesma ordem (essencial pra paginação: offset crescente não pode repetir/pular item)", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const seed = hashSeed("user123-2026082014");
    expect(seededShuffle(items, seed)).toEqual(seededShuffle(items, seed));
  });

  it("sementes diferentes tendem a produzir ordens diferentes", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = seededShuffle(items, hashSeed("user123-hora1"));
    const b = seededShuffle(items, hashSeed("user123-hora2"));
    expect(a).not.toEqual(b);
  });

  it("é uma permutação de verdade — mesmos itens, nenhum perdido/duplicado", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = seededShuffle(items, 12345);
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it("não muda o array original (imutável)", () => {
    const items = [1, 2, 3, 4, 5];
    const original = [...items];
    seededShuffle(items, 99);
    expect(items).toEqual(original);
  });

  it("lista vazia ou de 1 item não quebra", () => {
    expect(seededShuffle([], 1)).toEqual([]);
    expect(seededShuffle([42], 1)).toEqual([42]);
  });
});
