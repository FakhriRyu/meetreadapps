// @ts-nocheck - Migrated to Supabase
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = getSupabaseServer();
  const sessionUser = await getSessionUser();

  const [booksResult, usersResult, reviewsResult] = await Promise.all([
    supabase.from('Book').select('*').order('createdAt', { ascending: false }),
    supabase.from('User').select('id, name, email, role, createdAt, updatedAt').order('createdAt', { ascending: false }),
    supabase.from('Review').select('*, user:User!Review_userId_fkey(id, name, profileImage), book:Book!Review_bookId_fkey(title, coverImageUrl)').order('createdAt', { ascending: false }),
  ]);

  if (reviewsResult.error) {
    console.error("Error fetching reviews:", JSON.stringify(reviewsResult.error, null, 2));
  }

  const books = booksResult.data || [];
  const users = usersResult.data || [];
  const reviews = reviewsResult.data || [];

  console.log(`AdminPage: Fetched ${books.length} books, ${users.length} users, ${reviews.length} reviews`);

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
      initialReviews={reviews}
    />
  );
}
