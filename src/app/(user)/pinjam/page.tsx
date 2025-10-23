import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PinjamView } from "@/components/user/pinjam-view";

export const dynamic = "force-dynamic";

export default async function PinjamPage() {
  const [books, sessionUser] = await Promise.all([
    prisma.book.findMany({
      where: {
        OR: [{ ownerId: null }, { lendable: true, availableCopies: { gt: 0 } }],
      },
      orderBy: { createdAt: "desc" },
    }),
    getSessionUser(),
  ]);

  return <PinjamView books={books} sessionUser={sessionUser} />;
}
