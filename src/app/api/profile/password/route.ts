// @ts-nocheck - TODO: Migrate to Supabase
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";

const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Kata sandi saat ini minimal 8 karakter"),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
    path: ["newPassword"],
  });

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = UpdatePasswordSchema.parse(body);

    const supabase = getSupabaseServer();
    const { data: user, error } = await supabase
      .from('User')
      .select('passwordHash')
      .eq('id', sessionUser.id)
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    if (error || !user) {
      return NextResponse.json({ error: "Gagal memuat data pengguna." }, { status: 500 });
    }

    const isValid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Kata sandi saat ini tidak valid." }, { status: 400 });
    }

    const newHash = await hashPassword(data.newPassword);
    const { error: updateError } = await supabase
      .from('User')
      .update({ passwordHash: newHash })
      .eq('id', sessionUser.id);

    if (updateError) {
      return NextResponse.json({ error: "Gagal memperbarui kata sandi." }, { status: 500 });
    }

    return NextResponse.json({ message: "Kata sandi berhasil diperbarui." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal memperbarui kata sandi." }, { status: 500 });
  }
}
