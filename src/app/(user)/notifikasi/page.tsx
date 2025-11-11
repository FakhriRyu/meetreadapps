import { redirect } from "next/navigation";

import { NotificationView } from "@/components/user/notification-view";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function NotifikasiPage() {
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
