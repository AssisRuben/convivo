import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/push/expoPush", () => ({ sendPushToUser: vi.fn() }));

import { MAX_MESSAGE_LENGTH, chatPushTitle, normalizeMessage, previewOf } from "@/lib/chat/chatCore";

describe("mensagem do chat", () => {
  it("tira espaço das pontas", () => {
    expect(normalizeMessage("  Oi, tem dipirona?  ")).toBe("Oi, tem dipirona?");
  });

  it("recusa vazia, só espaço ou que não é texto", () => {
    expect(() => normalizeMessage("   ")).toThrow("Escreva uma mensagem");
    expect(() => normalizeMessage(undefined)).toThrow("Escreva uma mensagem");
    expect(() => normalizeMessage(42)).toThrow("Escreva uma mensagem");
  });

  it("recusa longa demais", () => {
    expect(() => normalizeMessage("a".repeat(MAX_MESSAGE_LENGTH + 1))).toThrow("muito longa");
    expect(normalizeMessage("a".repeat(MAX_MESSAGE_LENGTH))).toHaveLength(MAX_MESSAGE_LENGTH);
  });
});

describe("prévia na lista do gestor", () => {
  it("junta as linhas", () => {
    expect(previewOf("Bom dia\n\nTem   dipirona?")).toBe("Bom dia Tem dipirona?");
  });

  it("corta com reticências", () => {
    const preview = previewOf("x".repeat(300));
    expect(preview).toHaveLength(120);
    expect(preview.endsWith("…")).toBe(true);
  });
});

describe("título da notificação (uma por conversa)", () => {
  it("uma mensagem: só o nome", () => {
    expect(chatPushTitle("Maria", 1)).toBe("💬 Maria");
  });
  it("várias não lidas: conta, como no WhatsApp", () => {
    expect(chatPushTitle("Maria", 3)).toBe("💬 Maria (3 mensagens)");
  });
});
