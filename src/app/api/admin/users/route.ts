// @ts-nocheck - TODO: Migrate to Supabase
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses." }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const { data: users, error } = await supabase
    .from('User')
    .select('id, name, email, role, createdAt, updatedAt')
    .order('createdAt', { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data pengguna." }, { status: 500 });
  }

  return NextResponse.json({ data: users });
}
