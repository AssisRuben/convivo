import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { buildStoreCommissionEntries, linkedDay } from "@/lib/referral/storeCommission";
import type { StoreSale } from "@/lib/pharmacyDb";

function sale(vendaId: string, dataEmissao: string, marginCents: number): StoreSale {
  return { vendaId, numeroNota: null, dataEmissao, totalCents: marginCents * 3, marginCents };
}

describe("linkedDay", () => {
  it("usa o dia no horário de Brasília (mesmo calendário da nota da loja)", () => {
    expect(linkedDay(new Date("2026-10-15T16:31:25Z"))).toBe("2026-10-15");
    // 23h de Brasília do dia 15 ainda é dia 15, mesmo já sendo 16 em UTC
    expect(linkedDay(new Date("2026-10-16T02:00:00Z"))).toBe("2026-10-15");
  });
});

describe("buildStoreCommissionEntries", () => {
  it("credita 2% da margem pro amigo, com refKey por venda", () => {
    const entries = buildStoreCommissionEntries(
      [sale("10", "2026-11-24", 3000)],
      { name: "Anne", referredById: "assis", vendedorId: null },
      "2026-09-22"
    );
    expect(entries).toEqual([
      expect.objectContaining({
        userId: "assis",
        amountCents: 60,
        source: "REFERRAL_PURCHASE_COMMISSION",
        refKey: "comissao-amigo:venda:10",
      }),
    ]);
  });

  it("credita 5% pro vendedor", () => {
    const [entry] = buildStoreCommissionEntries(
      [sale("11", "2026-11-24", 3000)],
      { name: "Cliente", referredById: null, vendedorId: "vend" },
      "2026-09-22"
    );
    expect(entry).toMatchObject({ userId: "vend", amountCents: 150, source: "VENDEDOR_PURCHASE_COMMISSION" });
  });

  it("conta antiga com amigo e vendedor: cada um recebe a sua parte", () => {
    const entries = buildStoreCommissionEntries(
      [sale("12", "2026-11-24", 1000)],
      { name: "Cliente", referredById: "amigo", vendedorId: "vend" },
      "2026-09-22"
    );
    expect(entries.map((e) => [e.userId, e.amountCents])).toEqual([
      ["amigo", 20],
      ["vend", 50],
    ]);
  });

  it("ignora venda anterior ao vínculo (o próprio dia conta)", () => {
    const entries = buildStoreCommissionEntries(
      [sale("1", "2026-09-21", 3000), sale("2", "2026-09-22", 3000)],
      { name: "Anne", referredById: "assis", vendedorId: null },
      "2026-09-22"
    );
    expect(entries.map((e) => e.refKey)).toEqual(["comissao-amigo:venda:2"]);
  });

  it("sem margem ou comissão arredondada pra zero, nada entra", () => {
    const entries = buildStoreCommissionEntries(
      [sale("1", "2026-11-01", 0), sale("2", "2026-11-01", 20)],
      { name: "Anne", referredById: "assis", vendedorId: null },
      "2026-09-22"
    );
    expect(entries).toEqual([]);
  });

  it("sem vínculo, nada entra", () => {
    expect(
      buildStoreCommissionEntries(
        [sale("1", "2026-11-01", 3000)],
        { name: "Anne", referredById: null, vendedorId: null },
        "2026-09-22"
      )
    ).toEqual([]);
  });
});
