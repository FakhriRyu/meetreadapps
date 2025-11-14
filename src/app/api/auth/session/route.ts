// @ts-nocheck - TODO: Migrate to Supabase
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// import { prisma } from "@/lib/prisma" // DISABLED - Needs Supabase migration;
import { SESSION_COOKIE_NAME, parseSessionCookie } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(token ?? null);

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      role: true,
      createdAt: true,
    },
  });

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
