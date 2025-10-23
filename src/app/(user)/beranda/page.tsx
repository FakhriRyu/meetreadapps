import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { HomeView } from "@/components/user/home-view";

export const dynamic = "force-dynamic";

export default async function BerandaPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return null;
  }

  const books = await prisma.book.findMany({
    where: {
      OR: [{ ownerId: null }, { lendable: true }],
    },
    orderBy: { createdAt: "desc" },
  });

  return <HomeView books={books} sessionUser={sessionUser} />;
}
