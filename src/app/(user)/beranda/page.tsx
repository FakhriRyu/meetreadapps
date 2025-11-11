import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { HomeView } from "@/components/user/home-view";

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
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      coverImageUrl: true,
      publishedYear: true,
      totalCopies: true,
      availableCopies: true,
    },
  });

  return <HomeView books={books} sessionUser={sessionUser} />;
}
