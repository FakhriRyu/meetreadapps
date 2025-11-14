// @ts-nocheck - TODO: Migrate to Supabase
import { NextResponse } from "next/server";
import { z } from "zod";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { getSessionUser } from "@/lib/session";
import { BookStatus, BorrowRequestStatus } from "@/types/enums";

const RequestSchema = z.object({
  bookId: z.number().int().min(1, "ID buku tidak valid"),
  message: z.string().trim().max(500).optional(),
});

const normalizePhoneNumber = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) {
    return digits.replace(/\+/g, "").replace(/^0+/, "");
  }

  return digits.replace(/^0+/, "");
};

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = RequestSchema.parse(body);

    const book = await prisma.book.findUnique({
      where: { id: data.bookId },
      include: {
        owner: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
    }

    if (!book.owner || !book.ownerId) {
      return NextResponse.json(
        { error: "Buku ini belum memiliki pemilik, hubungi admin untuk peminjaman." },
        { status: 400 },
      );
    }

    if (book.ownerId === sessionUser.id) {
      return NextResponse.json({ error: "Anda tidak dapat meminjam buku milik sendiri." }, { status: 400 });
    }

    if (!book.owner.phoneNumber) {
      return NextResponse.json(
        { error: "Pemilik belum menambahkan nomor WhatsApp. Silakan pilih buku lain." },
        { status: 400 },
      );
    }

    if (book.status !== BookStatus.AVAILABLE) {
      return NextResponse.json(
        { error: "Buku sedang tidak tersedia untuk dipinjam." },
        { status: 409 },
      );
    }

    const existingPending = await prisma.borrowRequest.findFirst({
      where: {
        bookId: data.bookId,
        status: { in: [BorrowRequestStatus.PENDING] },
        requesterId: sessionUser.id,
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "Kamu sudah mengirim permintaan peminjaman untuk buku ini." },
        { status: 409 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(book.owner.phoneNumber);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Nomor WhatsApp pemilik tidak valid." },
        { status: 400 },
      );
    }

    const messageLines = [
      `Hai ${book.owner.name ?? "Admin"}, saya ${sessionUser.name} ingin meminjam buku "${book.title}".`,
      "Pesan ini dikirim melalui MeetRead.",
    ];
    if (data.message) {
      messageLines.push(`Catatan: ${data.message}`);
    }
    const encodedMessage = encodeURIComponent(messageLines.join("\n"));
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

    await prisma.$transaction(async (tx) => {
      await tx.borrowRequest.create({
        data: {
          bookId: book.id,
          requesterId: sessionUser.id,
          status: BorrowRequestStatus.PENDING,
          message: data.message ?? null,
          whatsappUrl,
        },
      });

      await tx.book.update({
        where: { id: book.id },
        data: { status: BookStatus.PENDING },
      });
    });

    return NextResponse.json({
      data: {
        whatsappUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal membuat permintaan peminjaman." }, { status: 500 });
  }
}
