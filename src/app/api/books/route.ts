// @ts-nocheck - TODO: Migrate to Supabase
import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase";
import { BookFormSchema } from "@/lib/validators/book";
import type { BookFormData } from "@/lib/validators/book";
import { BookStatus } from "@/types/enums";

const buildBookPayload = (payload: BookFormData, timestamp: string) => ({
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
  createdAt: timestamp,
  updatedAt: timestamp,
});

export async function GET() {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('Book')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data buku." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = BookFormSchema.parse(json);

    const supabase = getSupabaseServer();
    const timestamp = new Date().toISOString();
    const { data: created, error } = await supabase
      .from('Book')
      .insert(buildBookPayload(data, timestamp))
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "ISBN sudah terdaftar. Gunakan ISBN lain." },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: "Gagal membuat buku." }, { status: 500 });
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Gagal membuat buku" }, { status: 500 });
  }
}
