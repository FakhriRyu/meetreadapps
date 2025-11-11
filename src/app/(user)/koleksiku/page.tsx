import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { KoleksikuView } from "@/components/koleksiku/koleksiku-view";

export default async function KoleksikuPage() {
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
