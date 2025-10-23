import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { BookFormSchema } from "@/lib/validators/book";
import type { BookFormData } from "@/lib/validators/book";
import { Prisma } from "@prisma/client";

async function unwrapParams(
  params: { id: string } | Promise<{ id: string }>,
): Promise<{ id: string }> {
  if (typeof (params as Promise<{ id: string }> | { id: string }).then === "function") {
    return params as Promise<{ id: string }>;
  }

  return params as { id: string };
}

const toPrismaData = (payload: BookFormData) => ({
  title: payload.title,
  author: payload.author,
  category: payload.category ?? null,
  isbn: payload.isbn ?? null,
  publishedYear: payload.publishedYear ?? null,
  totalCopies: payload.totalCopies,
  availableCopies: payload.availableCopies,
  coverImageUrl: payload.coverImageUrl ?? null,
  description: payload.description ?? null,
});

const parseId = (id: string) => {
  const parsed = Number(id);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("ID buku tidak valid");
  }

  return parsed;
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await unwrapParams(params);
    const bookId = parseId(resolvedParams.id);
    const json = await request.json();
    const data = BookFormSchema.parse(json);

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: toPrismaData(data),
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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await unwrapParams(params);
    const bookId = parseId(resolvedParams.id);

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
