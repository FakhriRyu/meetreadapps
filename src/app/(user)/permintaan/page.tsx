import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RequestHistoryView } from "@/components/user/request-history-view";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// Revalidate cache setiap 10 detik
export const revalidate = 10;

// Metadata untuk SEO
export const metadata = {
  title: "Riwayat Permintaan - MeetRead",
  description: "Lihat riwayat permintaan peminjamanmu",
};

async function RequestData() {
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

export default function PermintaanPage() {
  return (
    <Suspense fallback={<PermintaanLoading />}>
      <RequestData />
    </Suspense>
  );
}

function PermintaanLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="h-7 w-48 animate-pulse rounded-full bg-slate-300" />
      <div className="mt-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-3xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
