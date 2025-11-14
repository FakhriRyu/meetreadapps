// @ts-nocheck - TODO: Migrate to Supabase
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function AdminPage() {
  const [books, users, sessionUser] = await Promise.all([
    prisma.book.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    getSessionUser(),
  ]);

  const managedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <AdminDashboard
      adminName={sessionUser?.name ?? "Admin"}
      initialBooks={books}
      initialUsers={managedUsers}
    />
  );
}
