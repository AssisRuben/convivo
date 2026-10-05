import { afterEach, describe, expect, it, vi } from "vitest";
import { getRequestContextStorage, isValidTimeZone } from "@/lib/timeZone";
import { todayDate } from "@/lib/timeline/format";
import { localClock } from "@/lib/reminders/dispatchCore";

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("dia e hora pelo fuso do celular", () => {
  afterEach(() => vi.useRealTimers());

  it("22:30 em Brasília (01:30 UTC do dia seguinte) ainda é o mesmo dia", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 27, 1, 30)));
    // Sem header (cron): Brasília
    expect(iso(todayDate())).toBe("2026-09-26");
    // Celular em Brasília
    getRequestContextStorage().run({ timeZone: "America/Sao_Paulo" }, () => {
      expect(iso(todayDate())).toBe("2026-09-26");
    });
  });

  it("segue o fuso que o celular mandar (Manaus é UTC-4)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 27, 3, 30))); // 00:30 Brasília, 23:30 Manaus
    getRequestContextStorage().run({ timeZone: "America/Sao_Paulo" }, () => {
      expect(iso(todayDate())).toBe("2026-09-27");
      expect(localClock(new Date()).minutes).toBe(30);
    });
    getRequestContextStorage().run({ timeZone: "America/Manaus" }, () => {
      expect(iso(todayDate())).toBe("2026-09-26");
      expect(localClock(new Date()).minutes).toBe(23 * 60 + 30);
    });
  });

  it("o fuso vale também depois de um await dentro da requisição", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 27, 3, 30)));
    await getRequestContextStorage().run({ timeZone: "America/Manaus" }, async () => {
      await Promise.resolve();
      await new Promise((r) => setImmediate(r));
      expect(iso(todayDate())).toBe("2026-09-26");
    });
  });

  it("valida o nome do fuso", () => {
    expect(isValidTimeZone("America/Sao_Paulo")).toBe(true);
    expect(isValidTimeZone("Nada/Existe")).toBe(false);
    expect(isValidTimeZone("'; drop table")).toBe(false);
  });
});
