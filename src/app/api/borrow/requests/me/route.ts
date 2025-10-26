import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
  }

  const requests = await prisma.borrowRequest.findMany({
    where: { requesterId: sessionUser.id },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          coverImageUrl: true,
          status: true,
          dueDate: true,
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const payload = requests.map((request) => ({
    id: request.id,
    status: request.status,
    message: request.message,
    ownerMessage: request.ownerMessage,
    ownerDecisionAt: request.ownerDecisionAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    whatsappUrl: request.whatsappUrl,
    book: {
      id: request.book.id,
      title: request.book.title,
      coverImageUrl: request.book.coverImageUrl,
      status: request.book.status,
      dueDate: request.book.dueDate?.toISOString() ?? null,
      ownerName: request.book.owner?.name ?? "Pemilik",
    },
  }));

  return NextResponse.json({ data: payload });
}
