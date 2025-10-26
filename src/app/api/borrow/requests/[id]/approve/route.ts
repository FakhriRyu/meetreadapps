import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { BookStatus, BorrowRequestStatus } from "@prisma/client";

const ApproveSchema = z.object({
  dueDate: z.coerce.date({
    required_error: "Tanggal pengembalian wajib diisi.",
    invalid_type_error: "Tanggal pengembalian tidak valid.",
  }),
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
    const data = ApproveSchema.parse(body);

    const now = new Date();
    if (data.dueDate <= now) {
      return NextResponse.json(
        { error: "Tanggal pengembalian harus setelah hari ini." },
        { status: 400 },
      );
    }

    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: {
        book: {
          select: {
            id: true,
            ownerId: true,
            status: true,
            lendable: true,
            availableCopies: true,
          },
        },
        requester: {
          select: { id: true },
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

    await prisma.$transaction(async (tx) => {
      await tx.borrowRequest.update({
        where: { id: borrowRequest.id },
        data: {
          status: BorrowRequestStatus.APPROVED,
          ownerDecisionAt: now,
          ownerMessage: data.message ?? null,
        },
      });

      await tx.book.update({
        where: { id: borrowRequest.book.id },
        data: {
          status: BookStatus.BORROWED,
          borrowerId: borrowRequest.requester.id,
          dueDate: data.dueDate,
          availableCopies: Math.max(0, borrowRequest.book.availableCopies - 1),
        },
      });

      await tx.borrowRequest.updateMany({
        where: {
          bookId: borrowRequest.book.id,
          id: { not: borrowRequest.id },
          status: BorrowRequestStatus.PENDING,
        },
        data: {
          status: BorrowRequestStatus.CANCELLED,
          ownerDecisionAt: now,
          ownerMessage: "Permintaan dibatalkan karena buku sudah dipinjam.",
        },
      });
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
        { error: error.errors[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal menyetujui permintaan." }, { status: 500 });
  }
}
