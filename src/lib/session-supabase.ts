// @ts-nocheck - Temporary: Supabase types inference issue
import { cookies } from "next/headers";
import { cache } from "react";

import { getSupabaseServer } from "@/lib/supabase";
import { SESSION_COOKIE_NAME, parseSessionCookie } from "@/lib/auth";

export const getSessionUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(token ?? null);

  if (!session) {
    console.log("getSessionUser: No session found");
    return null;
  }

  const { data: user, error: userError } = await getSupabaseServer()
    .from('User')
    .select('id, name, email, phoneNumber, profileImage, role, createdAt')
    .eq('id', session.id)
    .single();

  if (userError || !user) {
    console.log("getSessionUser: Error fetching user or user not found", userError);
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    profileImage: user.profileImage,
    role: user.role,
    joinedAt: user.createdAt,
  };
});

