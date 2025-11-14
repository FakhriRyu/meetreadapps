// @ts-nocheck - Migrated to Supabase
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

export default async function AdminPage() {
  const supabase = getSupabaseServer();
  const sessionUser = await getSessionUser();

  const [booksResult, usersResult] = await Promise.all([
    supabase.from('Book').select('*').order('createdAt', { ascending: false }),
    supabase.from('User').select('id, name, email, role, createdAt, updatedAt').order('createdAt', { ascending: false }),
  ]);

  const books = booksResult.data || [];
  const users = usersResult.data || [];

  const managedUsers = users.map((user: any) => ({
    ...user,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  return (
    <AdminDashboard
      adminName={sessionUser?.name ?? "Admin"}
      initialBooks={books}
      initialUsers={managedUsers}
    />
  );
}
