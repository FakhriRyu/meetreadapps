import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, createSessionCookie, verifyPassword } from "@/lib/auth";

const LoginAdminSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(4, "Kata sandi minimal 4 karakter"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = LoginAdminSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akun admin tidak ditemukan atau tidak memiliki akses." },
        { status: 403 },
      );
    }

    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah." },
        { status: 401 },
      );
    }

    const session = createSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expires,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Data tidak valid" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal masuk sebagai admin. Coba lagi nanti." }, { status: 500 });
  }
}
