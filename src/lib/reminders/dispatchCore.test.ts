import { describe, expect, it } from "vitest";
import { brasiliaClock } from "@/lib/reminders/dispatchCore";

describe("brasiliaClock", () => {
  it("16:15 UTC é 13:15 em Brasília", () => {
    const { minutes } = brasiliaClock(new Date(Date.UTC(2026, 8, 18, 16, 15)));
    expect(minutes).toBe(13 * 60 + 15);
  });

  it("02:00 UTC ainda é o dia anterior em Brasília (dia da semana acompanha)", () => {
    // 2026-09-18 é sexta (5); 02:00 UTC = 23:00 de quinta (4) em Brasília
    const { minutes, weekday } = brasiliaClock(new Date(Date.UTC(2026, 8, 18, 2, 0)));
    expect(minutes).toBe(23 * 60);
    expect(weekday).toBe(4);
  });

  it("11:00 UTC é 08:00 em Brasília (horário do lembrete diário)", () => {
    expect(brasiliaClock(new Date(Date.UTC(2026, 8, 18, 11, 0))).minutes).toBe(8 * 60);
  });
});
