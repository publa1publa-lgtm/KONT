import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env" });
config({ path: ".env.local", override: true });
config({ path: ".env.development.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/contentfabric",
  },
});
