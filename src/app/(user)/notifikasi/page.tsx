import { Suspense } from "react";
import { redirect } from "next/navigation";

import { NotificationView } from "@/components/user/notification-view";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// Revalidate cache setiap 5 detik untuk notifikasi real-time
export const revalidate = 5;

// Metadata untuk SEO
export const metadata = {
  title: "Notifikasi - MeetRead",
  description: "Lihat notifikasi dan update terbaru",
};

async function NotificationData() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?from=notifikasi");
  }

  const notifications = await prisma.borrowNotification.findMany({
    where: {
      request: { requesterId: sessionUser.id },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      request: {
        select: {
          book: {
            select: { id: true, title: true },
          },
          status: true,
        },
      },
    },
  });

  const serialized = notifications.map((notification) => ({
    id: notification.id,
    status: notification.request.status,
    type: notification.type,
    message: notification.message ?? null,
    createdAt: notification.createdAt.toISOString(),
    book: {
      id: notification.request.book.id,
      title: notification.request.book.title,
    },
  }));

  return <NotificationView notifications={serialized} />;
}

export default function NotifikasiPage() {
  return (
    <Suspense fallback={<NotifikasiLoading />}>
      <NotificationData />
    </Suspense>
  );
}

function NotifikasiLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="h-7 w-32 animate-pulse rounded-full bg-slate-300" />
      <div className="mt-8 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
