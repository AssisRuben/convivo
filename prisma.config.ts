import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // O CLI (migrate/db execute) precisa da conexão direta — o pool em modo
  // transaction (DATABASE_URL, porta 6543) trava em comandos que exigem
  // advisory lock. O app em runtime (src/lib/prisma.ts) continua na
  // conexão pooled normalmente.
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
