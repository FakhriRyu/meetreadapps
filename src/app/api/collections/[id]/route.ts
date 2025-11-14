// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { getSessionUser } from "@/lib/session";
import { BookStatus, Prisma } from "@/types/enums";

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
  lendable: z.boolean(),
  totalCopies: z.number().int().min(1),
  availableCopies: z.number().int().min(0),
  status: z.nativeEnum(BookStatus).optional(),
});

const isPrismaNotFoundError = (error: unknown): error is { code: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === "P2025"
  );
};

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda perlu login terlebih dahulu." }, { status: 401 });
  }

  const { id: paramsId } = await context.params;
  const idParam = paramsId?.toString().trim() ?? "";
  const idMatch = idParam.match(/(\d+)$/);
  const id = idMatch ? Number(idMatch[1]) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
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

    const current = await prisma.book.findFirst({
      where: { id, ownerId: sessionUser.id },
      select: { status: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Koleksi tidak ditemukan." }, { status: 404 });
    }

    const nextStatus =
      data.status ??
      (data.lendable === false
        ? BookStatus.UNAVAILABLE
        : current.status === BookStatus.BORROWED || current.status === BookStatus.PENDING
          ? current.status
          : data.availableCopies > 0
            ? BookStatus.AVAILABLE
            : BookStatus.RESERVED);

    const updated = await prisma.book.update({
      where: {
        id,
        ownerId: sessionUser.id,
      },
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
        source: "user",
        status: nextStatus,
      },
    });

    return NextResponse.json({ data: updated });
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

    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Koleksi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal memperbarui koleksi." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda perlu login terlebih dahulu." }, { status: 401 });
  }

  const { id: paramsId } = await context.params;
  const idParam = paramsId?.toString().trim() ?? "";
  const idMatch = idParam.match(/(\d+)$/);
  const id = idMatch ? Number(idMatch[1]) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  try {
    await prisma.book.delete({
      where: {
        id,
        ownerId: sessionUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Koleksi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal menghapus koleksi." }, { status: 500 });
  }
}
