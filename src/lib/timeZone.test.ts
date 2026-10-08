import { afterEach, describe, expect, it, vi } from "vitest";
import { getRequestContextStorage, isValidTimeZone, localWeekStart } from "@/lib/timeZone";
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

describe("semana local (segunda a domingo)", () => {
  afterEach(() => vi.useRealTimers());

  it("terça 22:30 em Brasília: semana começou na segunda 00:00 de Brasília", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 7, 1, 30))); // qua 01:30 UTC = ter 22:30 BRT
    const week = localWeekStart();
    expect(week.key).toBe("2026-10-05");
    expect(week.start.toISOString()).toBe("2026-10-05T03:00:00.000Z");
  });

  it("domingo à noite ainda é a mesma semana", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 12, 2, 0))); // seg 02:00 UTC = dom 23:00 BRT
    expect(localWeekStart().key).toBe("2026-10-05");
  });
});
