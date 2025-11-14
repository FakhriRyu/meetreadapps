// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { getSessionUser } from "@/lib/session";
import { createBorrowNotification } from "@/lib/notifications";
import { BorrowRequestStatus, NotificationType } from "@prisma/client";

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

    const borrowRequest = await prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: {
        book: {
          select: {
            id: true,
            ownerId: true,
            dueDate: true,
          },
        },
      },
    });

    if (!borrowRequest) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan." }, { status: 404 });
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

    await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: borrowRequest.book.id },
        data: {
          dueDate: data.dueDate,
        },
      });

      await tx.borrowRequest.update({
        where: { id: borrowRequest.id },
        data: {
          ownerMessage: data.message ?? borrowRequest.ownerMessage,
          ownerDecisionAt: now,
        },
      });
    });

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
