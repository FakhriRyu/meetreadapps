// @ts-nocheck - Temporary: Supabase types inference issue
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import type { Database } from "@/types/database.types";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^62\d{8,15}$/, "Nomor telepon harus diawali 62 dan minimal 10 digit"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = RegisterSchema.parse({
      ...body,
      phoneNumber: typeof body.phoneNumber === "string" ? body.phoneNumber.replace(/\s+/g, "") : body.phoneNumber,
    });

    const supabase = getSupabaseServer();

    const { data: existingUsers, error: checkError } = await supabase
      .from('User')
      .select('id')
      .eq('email', data.email.toLowerCase());

    if (!checkError && existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);

    const { error: insertError } = await supabase
      .from('User')
      .insert([{
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        phoneNumber: data.phoneNumber,
      }]);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    console.error('Registration error:', error);
    return NextResponse.json({ error: "Registrasi gagal. Coba lagi nanti." }, { status: 500 });
  }
}
