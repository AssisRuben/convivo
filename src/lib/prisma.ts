import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// idleTimeoutMillis padrão do `pg` é 10s — qualquer pausa maior que isso
// entre requests (super comum no uso normal do app) derrubava a conexão
// com o pooler remoto da Supabase, e o próximo clique pagava o handshake
// inteiro (TCP + TLS + auth) de novo, sentido como "clique lento". Sobe
// pra alguns minutos pra manter a conexão viva entre usos espaçados;
// keepAlive evita que a conexão morra silenciosamente (NAT/load balancer)
// durante esse tempo ocioso.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 300_000,
  keepAlive: true,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
