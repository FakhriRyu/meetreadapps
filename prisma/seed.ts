import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth";

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

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@meetread.com";
  const adminPasswordHash = await hashPassword("admin");

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrator",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
    create: {
      name: "Administrator",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const books = [
    {
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      category: "Software Engineering",
      isbn: "9780201616224",
      publishedYear: 1999,
      totalCopies: 5,
      availableCopies: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
      description: "Panduan klasik dalam membangun perangkat lunak yang tangguh dan berkelanjutan.",
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self Improvement",
      isbn: "9780735211292",
      publishedYear: 2018,
      totalCopies: 8,
      availableCopies: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794",
      description: "Strategi praktis membangun kebiasaan baik dan menghapus kebiasaan buruk.",
    },
    {
      title: "Educated",
      author: "Tara Westover",
      category: "Memoir",
      isbn: "9780399590504",
      publishedYear: 2018,
      totalCopies: 4,
      availableCopies: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1528207776546-365bb710ee93",
      description: "Perjalanan seorang perempuan keluar dari keluarga survivalis untuk mengejar pendidikan.",
    },
    {
      title: "Deep Work",
      author: "Cal Newport",
      category: "Productivity",
      isbn: "9781455586691",
      publishedYear: 2016,
      totalCopies: 6,
      availableCopies: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1522202222021-2375dc2fc343",
      description: "Prinsip fokus mendalam untuk mencapai produktivitas maksimal di tengah distraksi.",
    },
  ];

  await prisma.book.deleteMany();
  await prisma.book.createMany({ data: books });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Seed gagal dijalankan:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
