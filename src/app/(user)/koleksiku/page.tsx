import { Suspense } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { KoleksikuView } from "@/components/koleksiku/koleksiku-view";

// Revalidate cache setiap 10 detik karena data lebih dinamis
export const revalidate = 10;

// Metadata untuk SEO
export const metadata = {
  title: "Koleksiku - MeetRead",
  description: "Kelola koleksi buku dan permintaan peminjamanmu",
};

async function CollectionData() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?from=koleksiku");
  }

  const [collections, requests] = await Promise.all([
    prisma.book.findMany({
      where: { ownerId: sessionUser.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.borrowRequest.findMany({
      where: {
        book: { ownerId: sessionUser.id },
        status: { in: ["PENDING", "APPROVED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            availableCopies: true,
            totalCopies: true,
            lendable: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    }),
  ]);

  return <KoleksikuView collections={collections} requests={requests} />;
}

export default function KoleksikuPage() {
  return (
    <Suspense fallback={<KoleksikuLoading />}>
      <CollectionData />
    </Suspense>
  );
}

function KoleksikuLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <div className="h-7 w-32 animate-pulse rounded-full bg-slate-300" />
      <div className="mt-8 h-12 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
