import { describe, expect, it } from "vitest";
import { pushUrlFor, resolvePushUrl } from "./pushRoutes";

describe("pushUrlFor", () => {
  it("mapeia cada screen pra sua tela", () => {
    expect(pushUrlFor({ screen: "rotina" })).toBe("/rotina");
    expect(pushUrlFor({ screen: "medicamentos" })).toBe("/perfil/medicamentos");
    expect(pushUrlFor({ screen: "chat" })).toBe("/conversa");
  });

  it("chat do gestor vai pra conversa daquele cliente", () => {
    expect(pushUrlFor({ screen: "chat", threadId: "abc123" })).toBe("/conversa/abc123");
  });

  it("threadId estranho cai na lista de conversas", () => {
    expect(pushUrlFor({ screen: "chat", threadId: "../../x" })).toBe("/conversa");
  });

  it("sem screen ou screen desconhecida: sem URL", () => {
    expect(pushUrlFor(undefined)).toBeUndefined();
    expect(pushUrlFor({ screen: "nada" })).toBeUndefined();
  });
});

describe("resolvePushUrl", () => {
  it("aceita URL conhecida", () => {
    expect(resolvePushUrl({ url: "/perfil/carteira" })).toBe("/perfil/carteira");
    expect(resolvePushUrl({ url: "/conversa/t1" })).toBe("/conversa/t1");
  });

  it("recusa URL fora da lista e usa o screen", () => {
    expect(resolvePushUrl({ url: "https://golpe.com", screen: "rotina" })).toBe("/rotina");
    expect(resolvePushUrl({ url: "/perfil/meus-dados" })).toBeUndefined();
  });

  it("push antigo (só screen) continua funcionando", () => {
    expect(resolvePushUrl({ screen: "familia" })).toBe("/perfil/familia");
  });

  it("dado inválido não quebra", () => {
    expect(resolvePushUrl(null)).toBeUndefined();
    expect(resolvePushUrl("rotina")).toBeUndefined();
  });
});
