// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";
import { BookFormSchema } from "@/lib/validators/book";
import type { BookFormData } from "@/lib/validators/book";
import { BookStatus } from "@/types/enums";

const buildBookPayload = (payload: BookFormData, currentStatus?: BookStatus) => ({
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

    const supabase = getSupabaseServer();
    const { data: existing, error: currentError } = await supabase
      .from('Book')
      .select('status')
      .eq('id', bookId)
      .single();

    if (currentError?.code === 'PGRST116') {
      return NextResponse.json({ error: "Data buku tidak ditemukan" }, { status: 404 });
    }

    if (currentError || !existing) {
      return NextResponse.json({ error: "Gagal mengambil data buku." }, { status: 500 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('Book')
      .update(buildBookPayload(data, existing.status as BookStatus))
      .eq('id', bookId)
      .select('*')
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: "ISBN sudah terdaftar. Gunakan ISBN lain." },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: "Gagal memperbarui buku." }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
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

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('Book')
      .delete()
      .eq('id', bookId)
      .select('id')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Data buku tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json({ error: "Gagal menghapus buku." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes("tidak valid") ? 400 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Gagal memperbarui buku" }, { status: 500 });
  }
}
