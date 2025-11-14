// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { BookFormSchema } from "@/lib/validators/book";
import type { BookFormData } from "@/lib/validators/book";
import { BookStatus, Prisma } from "@/types/enums";

const toPrismaData = (payload: BookFormData, currentStatus?: BookStatus) => ({
  title: payload.title,
  author: payload.author,
  category: payload.category ?? null,
  isbn: payload.isbn ?? null,
  publishedYear: payload.publishedYear ?? null,
  totalCopies: payload.totalCopies,
  availableCopies: payload.availableCopies,
  coverImageUrl: payload.coverImageUrl ?? null,
  description: payload.description ?? null,
  status:
    currentStatus === BookStatus.BORROWED || currentStatus === BookStatus.PENDING
      ? currentStatus
      : payload.availableCopies > 0
        ? BookStatus.AVAILABLE
        : BookStatus.RESERVED,
});

const parseId = (id: string) => {
  const parsed = Number(id);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("ID buku tidak valid");
  }

  return parsed;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bookId = parseId(id);
    const json = await request.json();
    const data = BookFormSchema.parse(json);

    const existing = await prisma.book.findUnique({
      where: { id: bookId },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data buku tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: toPrismaData(data, existing.status),
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

      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Data buku tidak ditemukan" },
          { status: 404 },
        );
      }
    }

    if (error instanceof Error) {
      const status = error.message.includes("tidak valid") ? 400 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Gagal memperbarui buku" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const bookId = parseId(id);

    await prisma.book.delete({ where: { id: bookId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Data buku tidak ditemukan" },
          { status: 404 },
        );
      }
    }

    if (error instanceof Error) {
      const status = error.message.includes("tidak valid") ? 400 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Gagal menghapus buku" }, { status: 500 });
  }
}
