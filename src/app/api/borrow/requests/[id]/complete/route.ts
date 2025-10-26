import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { BookStatus, BorrowRequestStatus } from "@prisma/client";

const CompleteSchema = z.object({
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
    const data = CompleteSchema.parse(body ?? {});

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

    if (borrowRequest.status !== BorrowRequestStatus.APPROVED) {
      return NextResponse.json(
        { error: "Permintaan ini belum dalam status dipinjam." },
        { status: 400 },
      );
    }

    const now = new Date();

    const nextAvailable = Math.min(
      borrowRequest.book.totalCopies,
      borrowRequest.book.availableCopies + 1,
    );

    await prisma.$transaction(async (tx) => {
      await tx.borrowRequest.update({
        where: { id: borrowRequest.id },
        data: {
          status: BorrowRequestStatus.RETURNED,
          ownerDecisionAt: now,
          ownerMessage: data.message ?? null,
        },
      });

      await tx.book.update({
        where: { id: borrowRequest.book.id },
        data: {
          status:
            borrowRequest.book.lendable === false
              ? BookStatus.UNAVAILABLE
              : nextAvailable > 0
                ? BookStatus.AVAILABLE
                : BookStatus.RESERVED,
          borrowerId: null,
          dueDate: null,
          availableCopies: nextAvailable,
        },
      });
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
        { error: error.errors[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal menandai pengembalian." }, { status: 500 });
  }
}
