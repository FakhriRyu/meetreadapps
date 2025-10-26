import { redirect } from "next/navigation";

import { RequestHistoryView } from "@/components/user/request-history-view";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PermintaanPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?from=permintaan");
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

  const serializedRequests = requests.map((request) => ({
    id: request.id,
    status: request.status,
    message: request.message ?? null,
    ownerMessage: request.ownerMessage ?? null,
    ownerDecisionAt: request.ownerDecisionAt ? request.ownerDecisionAt.toISOString() : null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    whatsappUrl: request.whatsappUrl ?? null,
    book: {
      id: request.book.id,
      title: request.book.title,
      coverImageUrl: request.book.coverImageUrl ?? null,
      status: request.book.status,
      dueDate: request.book.dueDate ? request.book.dueDate.toISOString() : null,
      ownerName: request.book.owner?.name ?? "Pemilik",
    },
  }));

  return <RequestHistoryView requests={serializedRequests} />;
}
