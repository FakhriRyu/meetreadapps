import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseServer } from "@/lib/supabase";
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = LoginSchema.parse(body);

    const { data: user, error } = await supabaseServer
      .from('User')
      .select('id, name, email, passwordHash, role')
      .eq('email', data.email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah." },
        { status: 401 },
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
        { error: error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal masuk. Coba lagi nanti." }, { status: 500 });
  }
}
