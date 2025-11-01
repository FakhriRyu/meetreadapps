import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const normalizeSqliteUrl = (url: string | undefined) => {
  if (!url) return undefined;
  const prefix = "file:./";
  if (!url.startsWith("file:")) return url;
  if (!url.startsWith(prefix)) return url.replace(/\\/g, "/");

  const relativePath = url.slice(prefix.length);
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const normalizedPath = absolutePath.replace(/\\/g, "/");
  return `file:${normalizedPath}`;
};

const ensureSqliteFile = (url: string | undefined) => {
  if (!url?.startsWith("file:")) return;
  const filePath = url.replace("file:", "");
  const directory = path.dirname(filePath);

  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, "w"));
  }
};

const normalizedUrl = normalizeSqliteUrl(process.env.DATABASE_URL);
if (normalizedUrl && normalizedUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizedUrl;
}

const shouldEnsureSqliteFile =
  process.env.NODE_ENV !== "production" && process.env.DATABASE_URL?.startsWith("file:");
if (shouldEnsureSqliteFile) {
  try {
    ensureSqliteFile(process.env.DATABASE_URL);
  } catch (error) {
    console.warn("Prisma: gagal memastikan file SQLite:", error);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
