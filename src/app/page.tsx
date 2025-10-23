import { prisma } from "@/lib/prisma";
import { UserApp } from "@/components/user/user-app";

export default async function Home() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <UserApp initialBooks={books} />;
}
