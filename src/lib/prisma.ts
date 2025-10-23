import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const normalizeSqliteUrl = (url: string | undefined) => {
  if (!url) return undefined;
  const prefix = "file:./";
  if (!url.startsWith(prefix)) return url;

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

ensureSqliteFile(process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
