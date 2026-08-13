import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/** Bump when schema models/fields change so HMR drops a stale global client. */
const PRISMA_CLIENT_REV = 3;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRev?: number;
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

function clientHasPlanEvent(client: PrismaClient): boolean {
  const delegate = (client as unknown as { planEvent?: { create?: unknown; findMany?: unknown } }).planEvent;
  return Boolean(delegate && typeof delegate.create === "function" && typeof delegate.findMany === "function");
}

function getPrisma(): PrismaClient {
  const existing = globalForPrisma.prisma;
  const staleRev = globalForPrisma.prismaRev !== PRISMA_CLIENT_REV;
  const staleModel = existing ? !clientHasPlanEvent(existing) : false;

  // After `prisma generate`, Next HMR can keep a stale client without new models/fields.
  if (existing && (staleRev || staleModel)) {
    void existing.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaRev = PRISMA_CLIENT_REV;
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
