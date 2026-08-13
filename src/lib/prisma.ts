import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const isSupabase = /supabase\.com|pooler\.supabase/i.test(url);
  return new Pool({
    connectionString: url,
    // Supabase pooler presents a cert chain that Node rejects by default.
    ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
    max: 10,
  });
}

function createPrismaClient(): PrismaClient {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = createPool();
  }
  return new PrismaClient({
    adapter: new PrismaPg(globalForPrisma.pgPool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
