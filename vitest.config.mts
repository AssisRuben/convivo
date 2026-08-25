import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes de unidade só pra lógica pura de src/lib (cálculo de comissão,
// desconto, agendamento de dicas) — não roda componentes React Native,
// não precisa do preset jest-expo. Sem acesso a banco real aqui (a rede
// pro Postgres é bloqueada neste ambiente de dev), então os testes cobrem
// só as funções que não tocam Prisma diretamente.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
