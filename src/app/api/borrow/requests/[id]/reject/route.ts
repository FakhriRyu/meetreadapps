// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { getSessionUser } from "@/lib/session";
import { createBorrowNotification } from "@/lib/notifications";
import { BookStatus, BorrowRequestStatus, NotificationType } from "@prisma/client";

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

    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: {
        book: {
          select: {
            id: true,
            ownerId: true,
            lendable: true,
            availableCopies: true,
            totalCopies: true,
          },
        },
      },
    });

    if (!borrowRequest) {
      return NextResponse.json({ error: "Permintaan peminjaman tidak ditemukan." }, { status: 404 });
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

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.borrowRequest.update({
        where: { id: borrowRequest.id },
        data: {
          status: BorrowRequestStatus.REJECTED,
          ownerDecisionAt: now,
          ownerMessage: data.message ?? null,
        },
      });

      const remainingPending = await tx.borrowRequest.count({
        where: {
          bookId: borrowRequest.book.id,
          status: BorrowRequestStatus.PENDING,
        },
      });

      if (remainingPending === 0) {
        await tx.book.update({
          where: { id: borrowRequest.book.id },
          data: {
            status:
              borrowRequest.book.lendable === false
                ? BookStatus.UNAVAILABLE
                : borrowRequest.book.availableCopies > 0
                  ? BookStatus.AVAILABLE
                  : BookStatus.RESERVED,
            borrowerId: null,
            dueDate: null,
          },
        });
      }
    });

    await createBorrowNotification({
      requestId: borrowRequest.id,
      type: NotificationType.REJECTED,
      message: data.message ?? null,
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
