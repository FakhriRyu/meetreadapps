import { cookies } from "next/headers";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, parseSessionCookie } from "@/lib/auth";

export const getSessionUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(token ?? null);

  if (!session) {
    return null;
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
