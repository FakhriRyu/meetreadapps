// @ts-nocheck - TODO: Migrate to Supabase
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, parseSessionCookie } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(token ?? null);

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const supabase = getSupabaseServer();
  const { data: user, error } = await supabase
    .from('User')
    .select('id, name, email, phoneNumber, profileImage, role, createdAt')
    .eq('id', session.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: "Gagal mengambil data sesi." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      role: user.role,
      joinedAt: user.createdAt,
    },
  });
}
