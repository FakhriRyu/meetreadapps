// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { getSessionUser } from "@/lib/session";
import { createBorrowNotification } from "@/lib/notifications";
import { getSupabaseServer } from "@/lib/supabase";
import { BookStatus, BorrowRequestStatus, NotificationType } from "@/types/enums";

const CompleteSchema = z.object({
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
    const data = CompleteSchema.parse(body ?? {});

    const supabase = getSupabaseServer();
    const { data: borrowRequest, error: borrowError } = await supabase
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

    if (borrowError || !borrowRequest) {
      return NextResponse.json({ error: "Permintaan peminjaman tidak ditemukan." }, { status: 404 });
    }

    if (!borrowRequest.book) {
      return NextResponse.json({ error: "Data buku tidak ditemukan." }, { status: 404 });
    }

    if (borrowRequest.book.ownerId !== sessionUser.id) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke permintaan ini." }, { status: 403 });
    }

    if (borrowRequest.status !== BorrowRequestStatus.APPROVED) {
      return NextResponse.json(
        { error: "Permintaan ini belum dalam status dipinjam." },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString();

    const nextAvailable = Math.min(
      borrowRequest.book.totalCopies,
      borrowRequest.book.availableCopies + 1,
    );

    const message = data.message?.trim() ? data.message : null;

    const { error: updateRequestError } = await supabase
      .from('BorrowRequest')
      .update({
        status: BorrowRequestStatus.RETURNED,
        ownerDecisionAt: nowIso,
        ownerMessage: message,
      })
      .eq('id', borrowRequest.id);

    if (updateRequestError) {
      return NextResponse.json({ error: "Gagal memperbarui status permintaan." }, { status: 500 });
    }

    const targetStatus =
      borrowRequest.book.lendable === false
        ? BookStatus.UNAVAILABLE
        : nextAvailable > 0
          ? BookStatus.AVAILABLE
          : BookStatus.RESERVED;

    const { error: updateBookError } = await supabase
      .from('Book')
      .update({
        status: targetStatus,
        borrowerId: null,
        dueDate: null,
        availableCopies: nextAvailable,
      })
      .eq('id', borrowRequest.book.id);

    if (updateBookError) {
      return NextResponse.json({ error: "Gagal memperbarui data buku." }, { status: 500 });
    }

    await createBorrowNotification({
      requestId: borrowRequest.id,
      type: NotificationType.RETURNED,
      message,
    });

    return NextResponse.json({
      data: {
        id: borrowRequest.id,
        status: BorrowRequestStatus.RETURNED,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal menandai pengembalian." }, { status: 500 });
  }
}
