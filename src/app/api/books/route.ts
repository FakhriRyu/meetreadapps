// @ts-nocheck - TODO: Migrate to Supabase
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { BookFormSchema } from "@/lib/validators/book";
import type { BookFormData } from "@/lib/validators/book";
import { BookStatus, Prisma } from "@prisma/client";

const toPrismaData = (payload: BookFormData) => ({
  title: payload.title,
  author: payload.author,
  category: payload.category ?? null,
  isbn: payload.isbn ?? null,
  publishedYear: payload.publishedYear ?? null,
  totalCopies: payload.totalCopies,
  availableCopies:
    typeof payload.availableCopies === "number"
      ? payload.availableCopies
      : payload.totalCopies,
  coverImageUrl: payload.coverImageUrl ?? null,
  description: payload.description ?? null,
  status: (payload.availableCopies ?? payload.totalCopies) > 0 ? BookStatus.AVAILABLE : BookStatus.RESERVED,
});

export async function GET() {
  const books = await prisma.book.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ data: books });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = BookFormSchema.parse(json);

    const created = await prisma.book.create({
      data: toPrismaData(data),
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

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Gagal membuat buku" }, { status: 500 });
  }
}
