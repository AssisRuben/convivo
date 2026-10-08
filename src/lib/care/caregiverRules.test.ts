import { describe, expect, it } from "vitest";
import { MISSED_DOSE_ALERT_MINUTES, normalizeCode, shouldAlertMissedDose } from "@/lib/care/caregiverRules";

const base = { itemMinutes: 8 * 60, scheduledToday: true, completed: false, alreadyAlerted: false };

describe("alerta de dose não marcada pro cuidador", () => {
  it("regra combinada: 30 minutos", () => {
    expect(MISSED_DOSE_ALERT_MINUTES).toBe(30);
  });

  it("antes dos 30 minutos: não avisa", () => {
    expect(shouldAlertMissedDose({ ...base, nowMinutes: 8 * 60 + 29 })).toBe(false);
  });

  it("aos 30 minutos sem marcar: avisa", () => {
    expect(shouldAlertMissedDose({ ...base, nowMinutes: 8 * 60 + 30 })).toBe(true);
  });

  it("marcou, não está programada hoje ou já avisou: não avisa", () => {
    expect(shouldAlertMissedDose({ ...base, nowMinutes: 9 * 60, completed: true })).toBe(false);
    expect(shouldAlertMissedDose({ ...base, nowMinutes: 9 * 60, scheduledToday: false })).toBe(false);
    expect(shouldAlertMissedDose({ ...base, nowMinutes: 9 * 60, alreadyAlerted: true })).toBe(false);
  });

  it("muito tarde (mais de 3h): não avisa mais", () => {
    expect(shouldAlertMissedDose({ ...base, nowMinutes: 11 * 60 + 1 })).toBe(false);
  });
});

describe("código de convite", () => {
  it("aceita minúscula, espaço e traço", () => {
    expect(normalizeCode(" ab3-k9p ")).toBe("AB3K9P");
  });
});
