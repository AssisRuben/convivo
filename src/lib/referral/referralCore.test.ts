import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/wallet", () => ({ getWalletBalanceCents: vi.fn() }));

import { normalizeReferralCode, shortName } from "@/lib/referral/referralCore";

describe("nome curto (quem não é da casa vê só primeiro nome + inicial)", () => {
  it("nome e sobrenome", () => {
    expect(shortName("maria silva santos")).toBe("Maria S.");
  });
  it("um nome só", () => {
    expect(shortName("  Anne ")).toBe("Anne");
  });
});

describe("código digitado", () => {
  it("minúscula e espaço viram o formato gravado", () => {
    expect(normalizeReferralCode(" abc 12x9 ")).toBe("ABC12X9");
  });
});
