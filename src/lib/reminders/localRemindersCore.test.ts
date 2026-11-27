import { describe, expect, it } from "vitest";
import { localDayKey, planReminders, type ReminderItem } from "./localRemindersCore";

// Quarta, 2026-11-25, 10:00 no relógio local.
const NOW = new Date(2026, 10, 25, 10, 0);
const TODAY = "2026-11-25";

function item(overrides: Partial<ReminderItem> = {}): ReminderItem {
  return {
    id: "a",
    title: "Losartana",
    timeOfDay: "08:00",
    daysOfWeek: [],
    completedToday: false,
    medicationTrackingId: null,
    remindUntil: null,
    ...overrides,
  };
}

describe("planReminders", () => {
  it("todo dia: pula o horário que já passou hoje e agenda os 6 seguintes", () => {
    const { reminders, coveredUntil } = planReminders([item()], NOW, TODAY);
    expect(reminders.map((r) => r.dayKey)).toEqual([
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
    ]);
    expect(reminders[0].fireAt.getHours()).toBe(8);
    expect(coveredUntil).toBe("2026-12-01");
  });

  it("id leva item, dia e horário; texto igual ao do servidor", () => {
    const [first] = planReminders([item({ timeOfDay: "20:30" })], NOW, TODAY).reminders;
    expect(first.id).toBe("rotina_a_2026-11-25_2030");
    expect(first.title).toBe("Hora de cuidar de você 💊");
    expect(first.body).toBe("Losartana — 20:30");
  });

  it("marcado hoje: não lembra hoje, lembra amanhã", () => {
    const { reminders } = planReminders([item({ timeOfDay: "20:00", completedToday: true })], NOW, TODAY);
    expect(reminders[0].dayKey).toBe("2026-11-26");
  });

  it("lista de ontem: completedToday não vale pra hoje", () => {
    const { reminders } = planReminders([item({ timeOfDay: "20:00", completedToday: true })], NOW, "2026-11-24");
    expect(reminders[0].dayKey).toBe(TODAY);
  });

  it("só nos dias programados (0 = domingo)", () => {
    const { reminders } = planReminders([item({ timeOfDay: "20:00", daysOfWeek: [0, 3] })], NOW, TODAY);
    expect(reminders.map((r) => r.dayKey)).toEqual(["2026-11-25", "2026-11-29"]);
  });

  it("para depois do último dia do tratamento", () => {
    const { reminders } = planReminders([item({ timeOfDay: "20:00", remindUntil: "2026-11-26" })], NOW, TODAY);
    expect(reminders.map((r) => r.dayKey)).toEqual(["2026-11-25", "2026-11-26"]);
  });

  it("servidor antigo (sem remindUntil): remédio só até amanhã", () => {
    const { reminders } = planReminders(
      [item({ timeOfDay: "20:00", medicationTrackingId: "m1", remindUntil: undefined })],
      NOW,
      TODAY
    );
    expect(reminders.map((r) => r.dayKey)).toEqual(["2026-11-25", "2026-11-26"]);
  });

  it("remédio ganha os botões de dose; o resto, os de cuidado", () => {
    const [dose] = planReminders([item({ timeOfDay: "20:00", category: "MEDICACAO" })], NOW, TODAY).reminders;
    const [ficha] = planReminders([item({ timeOfDay: "20:00", medicationTrackingId: "m1" })], NOW, TODAY).reminders;
    const [outro] = planReminders([item({ timeOfDay: "20:00", category: "EXERCICIO" })], NOW, TODAY).reminders;
    expect([dose.actionCategory, ficha.actionCategory, outro.actionCategory]).toEqual(["dose", "dose", "cuidado"]);
  });

  it("sem horário não agenda", () => {
    expect(planReminders([item({ timeOfDay: null })], NOW, TODAY).reminders).toEqual([]);
  });

  it("limite: corta pelos mais próximos e cobre só até a véspera do corte", () => {
    const items = ["09:00", "12:00", "18:00", "21:00"].map((t, i) => item({ id: `i${i}`, timeOfDay: t }));
    // hoje sobram 12, 18, 21 (3); limite 6 = hoje + 3 de amanhã (9, 12, 18)
    const { reminders, coveredUntil } = planReminders(items, NOW, TODAY, 7, 6);
    expect(reminders).toHaveLength(6);
    expect(reminders.at(-1)!.dayKey).toBe("2026-11-26");
    // cortou dentro de amanhã (21:00 ficou de fora) → só hoje está completo
    expect(coveredUntil).toBe(TODAY);
  });

  it("limite cortando já hoje: nenhum dia coberto", () => {
    const items = ["12:00", "18:00"].map((t, i) => item({ id: `i${i}`, timeOfDay: t }));
    expect(planReminders(items, NOW, TODAY, 7, 1).coveredUntil).toBeNull();
  });
});

describe("localDayKey", () => {
  it("usa o dia local", () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
