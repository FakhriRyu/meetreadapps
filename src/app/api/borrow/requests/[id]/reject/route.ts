import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { BookStatus, BorrowRequestStatus } from "@prisma/client";

const RejectSchema = z.object({
  message: z.string().trim().max(500).optional(),
});

const parseParamsId = (params: { id: string }) => {
  const parsed = Number(params.id);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("ID permintaan tidak valid.");
  }
  return parsed;
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
  }

  let requestId: number;
  try {
    const resolvedParams = await context.params;
    requestId = parseParamsId(resolvedParams);
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

    return NextResponse.json({
      data: {
        id: borrowRequest.id,
        status: BorrowRequestStatus.REJECTED,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal menolak permintaan." }, { status: 500 });
  }
}
