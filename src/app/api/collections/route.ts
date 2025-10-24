import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { BookStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const CollectionSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi"),
  author: z.string().trim().min(1, "Penulis wajib diisi"),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
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

    const normalizedCover = data.coverImageUrl?.trim();
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
        category: data.category,
        description: data.description,
        coverImageUrl: normalizedCover && normalizedCover.length > 0 ? normalizedCover : null,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ error: "Gagal menambahkan koleksi." }, { status: 500 });
  }
}
