import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const cleared = clearSessionCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: cleared.value,
    expires: cleared.expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
