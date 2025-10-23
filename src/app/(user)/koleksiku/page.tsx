import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { KoleksikuView } from "@/components/koleksiku/koleksiku-view";

export const dynamic = "force-dynamic";

export default async function KoleksikuPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?from=koleksiku");
  }

  const collections = await prisma.book.findMany({
    where: { ownerId: sessionUser.id },
    orderBy: { createdAt: "desc" },
  });

  return <KoleksikuView collections={collections} />;
}
