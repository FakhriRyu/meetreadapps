// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/session";
import { createBorrowNotification } from "@/lib/notifications";
import { getSupabaseServer } from "@/lib/supabase";
import { BookStatus, BorrowRequestStatus, NotificationType } from "@/types/enums";

const RejectSchema = z.object({
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
    const data = RejectSchema.parse(body ?? {});

    const supabase = getSupabaseServer();
    const { data: borrowRequest, error: requestError } = await supabase
      .from('BorrowRequest')
      .select(`
        id,
        status,
        bookId,
        book:Book!BorrowRequest_bookId_fkey(
          id,
          ownerId,
          lendable,
          availableCopies,
          totalCopies
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

    const nowIso = new Date().toISOString();
    const ownerMessage = data.message?.trim() ? data.message : null;

    const { error: updateRequestError } = await supabase
      .from('BorrowRequest')
      .update({
        status: BorrowRequestStatus.REJECTED,
        ownerDecisionAt: nowIso,
        ownerMessage,
        updatedAt: nowIso,
      })
      .eq('id', borrowRequest.id);

    if (updateRequestError) {
      return NextResponse.json({ error: "Gagal memperbarui permintaan." }, { status: 500 });
    }

    const { count: remainingPending, error: countError } = await supabase
      .from('BorrowRequest')
      .select('id', { count: 'exact', head: true })
      .eq('bookId', borrowRequest.book.id)
      .eq('status', BorrowRequestStatus.PENDING);

    if (countError) {
      return NextResponse.json({ error: "Gagal memeriksa permintaan lainnya." }, { status: 500 });
    }

    if ((remainingPending ?? 0) === 0) {
      const nextStatus =
        borrowRequest.book.lendable === false
          ? BookStatus.UNAVAILABLE
          : borrowRequest.book.availableCopies > 0
            ? BookStatus.AVAILABLE
            : BookStatus.RESERVED;

      const { error: updateBookError } = await supabase
        .from('Book')
        .update({
          status: nextStatus,
          borrowerId: null,
          dueDate: null,
          updatedAt: nowIso,
        })
        .eq('id', borrowRequest.book.id);

      if (updateBookError) {
        return NextResponse.json({ error: "Gagal memperbarui buku." }, { status: 500 });
      }
    }

    await createBorrowNotification({
      requestId: borrowRequest.id,
      type: NotificationType.REJECTED,
      message: ownerMessage,
    });

    return NextResponse.json({
      data: {
        id: borrowRequest.id,
        status: BorrowRequestStatus.REJECTED,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal menolak permintaan." }, { status: 500 });
  }
}
