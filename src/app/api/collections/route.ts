// @ts-nocheck - TODO: Migrate to Supabase
import { NextResponse } from "next/server";
import { z } from "zod";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { getSessionUser } from "@/lib/session";
import { BookStatus, Prisma } from "@prisma/client";

const CollectionSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi"),
  author: z.string().trim().min(1, "Penulis wajib diisi"),
  category: z.string().trim().nullish(),
  description: z.string().trim().nullish(),
  coverImageUrl: z.string().trim().url().nullish(),
  isbn: z
    .string()
    .trim()
    .min(3, "ISBN minimal 3 karakter")
    .max(32, "ISBN maksimal 32 karakter")
    .nullish(),
  publishedYear: z
    .number({ error: "Tahun terbit tidak valid" })
    .int()
    .min(1000, "Tahun terbit tidak valid")
    .max(new Date().getFullYear() + 1, "Tahun terbit tidak valid")
    .nullish(),
  lendable: z.boolean().default(true),
  totalCopies: z.number().int().min(1),
  availableCopies: z.number().int().min(0),
  status: z.nativeEnum(BookStatus).optional(),
});

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda perlu login terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = CollectionSchema.parse(body);

    if (data.availableCopies > data.totalCopies) {
      return NextResponse.json(
        { error: "Eksemplar tersedia tidak boleh melebihi total eksemplar." },
        { status: 400 },
      );
    }

    const normalizedCategory = data.category && data.category.trim().length > 0 ? data.category.trim() : null;
    const normalizedDescription =
      data.description && data.description.trim().length > 0 ? data.description.trim() : null;
    const normalizedCover =
      data.coverImageUrl && data.coverImageUrl.trim().length > 0 ? data.coverImageUrl.trim() : null;
    const normalizedIsbn = data.isbn && data.isbn.trim().length > 0 ? data.isbn.trim() : null;
    const normalizedPublishedYear =
      typeof data.publishedYear === "number" ? data.publishedYear : null;
    const status =
      data.status ??
      (data.lendable === false
        ? BookStatus.UNAVAILABLE
        : data.availableCopies > 0
          ? BookStatus.AVAILABLE
          : BookStatus.RESERVED);

    const created = await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        category: normalizedCategory,
        description: normalizedDescription,
        coverImageUrl: normalizedCover,
        isbn: normalizedIsbn,
        publishedYear: normalizedPublishedYear,
        lendable: data.lendable,
        totalCopies: data.totalCopies,
        availableCopies: data.availableCopies,
        ownerId: sessionUser.id,
        source: "user",
        status,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "ISBN sudah terdaftar. Gunakan ISBN lain." },
          { status: 409 },
        );
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ error: "Gagal menambahkan koleksi." }, { status: 500 });
  }
}
