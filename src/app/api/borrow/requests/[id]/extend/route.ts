// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/session";
import { createBorrowNotification } from "@/lib/notifications";
import { getSupabaseServer } from "@/lib/supabase";
import { BorrowRequestStatus, NotificationType } from "@/types/enums";

const ExtendSchema = z.object({
  dueDate: z.coerce.date(),
  message: z.string().trim().max(500).optional(),
});

const parseId = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("ID permintaan tidak valid.");
  }
  return parsed;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
  }

  let requestId: number;
  try {
    const { id } = await context.params;
    requestId = parseId(id);
  } catch {
    return NextResponse.json({ error: "ID permintaan tidak valid." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data = ExtendSchema.parse(body);
    const now = new Date();
    if (data.dueDate <= now) {
      return NextResponse.json(
        { error: "Tanggal pengembalian baru harus setelah hari ini." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();
    const { data: borrowRequest, error: requestError } = await supabase
      .from('BorrowRequest')
      .select(`
        id,
        status,
        ownerMessage,
        bookId,
        book:Book!BorrowRequest_bookId_fkey(
          id,
          ownerId,
          dueDate
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError?.code === 'PGRST116') {
      return NextResponse.json({ error: "Permintaan tidak ditemukan." }, { status: 404 });
    }

    if (requestError || !borrowRequest) {
      return NextResponse.json({ error: "Gagal mengambil permintaan." }, { status: 500 });
    }

    if (borrowRequest.book.ownerId !== sessionUser.id) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke permintaan ini." }, { status: 403 });
    }

    if (borrowRequest.status !== BorrowRequestStatus.APPROVED) {
      return NextResponse.json(
        { error: "Tanggal hanya dapat diperpanjang ketika buku sedang dipinjam." },
        { status: 400 },
      );
    }

    const nowIso = now.toISOString();
    const message = data.message?.trim() ? data.message : borrowRequest.ownerMessage ?? null;

    const { error: updateBookError } = await supabase
      .from('Book')
      .update({ dueDate: data.dueDate.toISOString() })
      .eq('id', borrowRequest.book.id);

    if (updateBookError) {
      return NextResponse.json({ error: "Gagal memperbarui data buku." }, { status: 500 });
    }

    const { error: updateRequestError } = await supabase
      .from('BorrowRequest')
      .update({
        ownerMessage: message,
        ownerDecisionAt: nowIso,
      })
      .eq('id', borrowRequest.id);

    if (updateRequestError) {
      return NextResponse.json({ error: "Gagal memperbarui permintaan." }, { status: 500 });
    }

    await createBorrowNotification({
      requestId: borrowRequest.id,
      type: NotificationType.EXTENDED,
      message: data.message ?? null,
    });

    return NextResponse.json({
      data: {
        id: borrowRequest.id,
        dueDate: data.dueDate.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal memperpanjang peminjaman." }, { status: 500 });
  }
}
