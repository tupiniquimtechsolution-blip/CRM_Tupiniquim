import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { config } from "dotenv";
import { resolveDatabaseUrl } from "@/lib/database-url";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
