import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const CollectionSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi"),
  author: z.string().trim().min(1, "Penulis wajib diisi"),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  lendable: z.boolean(),
  totalCopies: z.number().int().min(1),
  availableCopies: z.number().int().min(0),
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
  request: Request,
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

    const updated = await prisma.book.update({
      where: {
        id,
        ownerId: sessionUser.id,
      },
      data: {
        title: data.title,
        author: data.author,
        category: data.category,
        description: data.description,
        coverImageUrl: data.coverImageUrl && data.coverImageUrl.length > 0 ? data.coverImageUrl : null,
        lendable: data.lendable,
        totalCopies: data.totalCopies,
        availableCopies: data.availableCopies,
        source: "user",
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Koleksi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal memperbarui koleksi." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
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
