// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/session";
import { createBorrowNotification } from "@/lib/notifications";
import { getSupabaseServer } from "@/lib/supabase";
import { BookStatus, BorrowRequestStatus, NotificationType } from "@/types/enums";

const ApproveSchema = z.object({
  dueDate: z.coerce.date(),
  message: z.string().trim().max(500).optional(),
});

const parseRequestId = (rawId: string) => {
  const parsed = Number(rawId);
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
    requestId = parseRequestId(id);
  } catch {
    return NextResponse.json({ error: "ID permintaan tidak valid." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data = ApproveSchema.parse(body);

    const now = new Date();
    if (data.dueDate <= now) {
      return NextResponse.json(
        { error: "Tanggal pengembalian harus setelah hari ini." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();
    const { data: borrowRequest, error: requestError } = await supabase
      .from('BorrowRequest')
      .select(`
        id,
        status,
        requesterId,
        bookId,
        book:Book!BorrowRequest_bookId_fkey(
          id,
          ownerId,
          status,
          lendable,
          availableCopies
        ),
        requester:User!BorrowRequest_requesterId_fkey(
          id
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError?.code === 'PGRST116') {
      return NextResponse.json({ error: "Permintaan peminjaman tidak ditemukan." }, { status: 404 });
    }

    if (requestError || !borrowRequest) {
      return NextResponse.json({ error: "Gagal mengambil permintaan." }, { status: 500 });
    }

    if (borrowRequest.book.ownerId !== sessionUser.id) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke permintaan ini." }, { status: 403 });
    }

    if (borrowRequest.status !== BorrowRequestStatus.PENDING) {
      return NextResponse.json(
        { error: "Permintaan ini sudah diproses sebelumnya." },
        { status: 400 },
      );
    }

    if (borrowRequest.book.lendable === false) {
      return NextResponse.json(
        { error: "Buku sedang dinonaktifkan dari peminjaman. Aktifkan kembali sebelum menyetujui." },
        { status: 400 },
      );
    }

    if (borrowRequest.book.availableCopies <= 0) {
      return NextResponse.json(
        { error: "Stok buku kosong. Perbarui stok sebelum menyetujui permintaan." },
        { status: 400 },
      );
    }

    const nowIso = now.toISOString();
    const ownerMessage = data.message ?? null;

    const { error: updateCurrentError } = await supabase
      .from('BorrowRequest')
      .update({
        status: BorrowRequestStatus.APPROVED,
        ownerDecisionAt: nowIso,
        ownerMessage,
      })
      .eq('id', borrowRequest.id);

    if (updateCurrentError) {
      return NextResponse.json({ error: "Gagal memperbarui permintaan." }, { status: 500 });
    }

    const { error: updateBookError } = await supabase
      .from('Book')
      .update({
        status: BookStatus.BORROWED,
        borrowerId: borrowRequest.requester.id,
        dueDate: data.dueDate.toISOString(),
        availableCopies: Math.max(0, borrowRequest.book.availableCopies - 1),
        updatedAt: nowIso,
      })
      .eq('id', borrowRequest.book.id);

    if (updateBookError) {
      return NextResponse.json({ error: "Gagal memperbarui buku." }, { status: 500 });
    }

    const { error: cancelOthersError } = await supabase
      .from('BorrowRequest')
      .update({
        status: BorrowRequestStatus.CANCELLED,
        ownerDecisionAt: nowIso,
        ownerMessage: "Permintaan dibatalkan karena buku sudah dipinjam.",
      })
      .eq('bookId', borrowRequest.book.id)
      .eq('status', BorrowRequestStatus.PENDING)
      .neq('id', borrowRequest.id);

    if (cancelOthersError) {
      return NextResponse.json({ error: "Gagal memperbarui permintaan lain." }, { status: 500 });
    }

    await createBorrowNotification({
      requestId: borrowRequest.id,
      type: NotificationType.APPROVED,
      message: ownerMessage,
    });

    return NextResponse.json({
      data: {
        id: borrowRequest.id,
        status: BorrowRequestStatus.APPROVED,
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

    return NextResponse.json({ error: "Gagal menyetujui permintaan." }, { status: 500 });
  }
}
