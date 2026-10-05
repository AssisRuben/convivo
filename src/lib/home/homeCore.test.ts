import { beforeEach, describe, expect, it, vi } from "vitest";
// vi.mock abaixo é içado pro topo pelo vitest — o import já recebe os mocks
import { getHomeDashboardForUser } from "@/lib/home/homeCore";

const findItems = vi.fn();
const findTrackings = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careChecklistItem: { findMany: (...args: unknown[]) => findItems(...args) },
    medicationTracking: { findMany: (...args: unknown[]) => findTrackings(...args) },
    // resumo de Saúde da Home (sem medição)
    healthMeasurement: { findFirst: async () => null },
  },
}));
// resumos de trilhas de leitura da Home — fora do escopo destes testes
vi.mock("@/lib/wisdom/wisdomCore", () => ({ getWisdomTopicsSummaryForUser: async () => [] }));
vi.mock("@/lib/faith/faithCore", () => ({ getFaithBooksSummaryForUser: async () => [] }));
vi.mock("@/lib/loyalty/loyaltyCore", () => ({
  getLoyaltyProgress: async () => ({ stampsFilled: 0, stampsTotal: 10, totalRewardCents: 0 }),
}));
vi.mock("@/lib/catalog/catalogDb", () => ({ getActivePromotions: async () => [] }));
// "hoje" fixo: 05/10/2026 (todayDate usa a data UTC)
vi.mock("@/lib/timeline/format", () => ({
  todayDate: () => new Date("2026-10-05T00:00:00Z"),
}));

const d =(iso: string) => new Date(`${iso}T00:00:00Z`);
// 14:00 em Brasília = 17:00 UTC
const AGORA = new Date("2026-10-05T17:00:00Z");

function item(over: Record<string, unknown>) {
  return {
    id: "x",
    title: "Remédio",
    timeOfDay: "08:00",
    daysOfWeek: [],
    medicationTrackingId: null,
    medicationTracking: null,
    completions: [],
    ...over,
  };
}

const antibiotico = { id: "t-anti", purchaseDate: d("2026-10-01"), treatmentDays: 7, active: true };
const losartana = { id: "t-los", purchaseDate: d("2026-08-10"), treatmentDays: null, active: true };

beforeEach(() => {
  findItems.mockReset();
  findTrackings.mockReset().mockResolvedValue([]);
});

describe("getHomeDashboardForUser — medicamentos de hoje", () => {
  it("lista todas as doses do dia (não só uma), por horário, com status", async () => {
    findItems.mockResolvedValue([
      item({ id: "c", title: "Vitamina D", timeOfDay: null }),
      item({ id: "b", title: "Losartana", timeOfDay: "20:00" }),
      item({ id: "a", title: "Omeprazol", timeOfDay: "07:00", completions: [{ date: d("2026-10-05") }] }),
      item({ id: "e", title: "Dipirona", timeOfDay: "12:00" }),
    ]);

    const { todayDoses, nextDose } = await getHomeDashboardForUser("u1", AGORA);

    expect(todayDoses.map((x) => [x.title, x.taken, x.overdue])).toEqual([
      ["Omeprazol", true, false],
      ["Dipirona", false, true], // 12:00 já passou às 14:00
      ["Losartana", false, false],
      ["Vitamina D", false, false], // sem horário vai pro fim e nunca fica "atrasado"
    ]);
    // compatibilidade com app antigo: a próxima pendente que ainda não passou
    expect(nextDose).toMatchObject({ checklistItemId: "b", overdue: false });
  });

  it("tratamento com prazo mostra 'dia X de N'", async () => {
    findItems.mockResolvedValue([
      item({ id: "a1", title: "Amoxicilina", medicationTrackingId: "t-anti", medicationTracking: antibiotico }),
    ]);
    const { todayDoses } = await getHomeDashboardForUser("u1", AGORA);
    expect(todayDoses[0].period).toEqual({ kind: "tratamento", day: 5, totalDays: 7 });
  });

  it("tratamento encerrado some da lista", async () => {
    findItems.mockResolvedValue([
      item({
        id: "a1",
        medicationTrackingId: "t-old",
        medicationTracking: { id: "t-old", purchaseDate: d("2026-09-20"), treatmentDays: 7, active: true },
      }),
    ]);
    const { todayDoses, nextDose } = await getHomeDashboardForUser("u1", AGORA);
    expect(todayDoses).toEqual([]);
    expect(nextDose).toBeNull();
  });

  it("uso contínuo soma o mês somando TODOS os horários da ficha", async () => {
    findItems.mockResolvedValue([
      item({
        id: "l1",
        title: "Losartana",
        timeOfDay: "08:00",
        medicationTrackingId: "t-los",
        medicationTracking: losartana,
        completions: [{ date: d("2026-10-01") }, { date: d("2026-10-02") }, { date: d("2026-10-05") }],
      }),
      item({
        id: "l2",
        title: "Losartana",
        timeOfDay: "20:00",
        medicationTrackingId: "t-los",
        medicationTracking: losartana,
        completions: [{ date: d("2026-10-01") }],
      }),
    ]);

    const { todayDoses } = await getHomeDashboardForUser("u1", AGORA);
    // 5 dias x 2 doses = 10 previstas; 4 tomadas
    expect(todayDoses.map((x) => x.period)).toEqual([
      { kind: "continuo", month: 10, taken: 4, expected: 10 },
      { kind: "continuo", month: 10, taken: 4, expected: 10 },
    ]);
    expect(todayDoses.map((x) => x.taken)).toEqual([true, false]);
  });

  it("respeita os dias da semana do item (05/10/2026 é segunda)", async () => {
    findItems.mockResolvedValue([
      item({ id: "seg", title: "Só segunda", daysOfWeek: [1] }),
      item({ id: "sab", title: "Só sábado", daysOfWeek: [6] }),
    ]);
    const { todayDoses } = await getHomeDashboardForUser("u1", AGORA);
    expect(todayDoses.map((x) => x.checklistItemId)).toEqual(["seg"]);
  });
});
