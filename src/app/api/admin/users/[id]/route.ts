// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase";

const UpdateUserSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").optional(),
    email: z.string().trim().email("Email tidak valid").optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
    password: z.string().trim().min(8, "Kata sandi minimal 8 karakter").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Tidak ada perubahan yang diberikan.",
  });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Anda tidak memiliki akses." }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "ID pengguna tidak valid." }, { status: 400 });
  }

  try {
    const json = await request.json();
    const data = UpdateUserSchema.parse(json);
    const passwordHash = data.password ? await hashPassword(data.password) : undefined;

    const supabase = getSupabaseServer();
    const updatePayload: Record<string, unknown> = {};
    if (data.name) updatePayload.name = data.name;
    if (data.email) updatePayload.email = data.email.toLowerCase();
    if (data.role) updatePayload.role = data.role;
    if (passwordHash) updatePayload.passwordHash = passwordHash;

    const { data: updated, error } = await supabase
      .from('User')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, name, email, role, createdAt, updatedAt')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh pengguna lain." },
          { status: 409 },
        );
      }

      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
      }

      return NextResponse.json({ error: "Gagal memperbarui data pengguna." }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Gagal memperbarui data pengguna." }, { status: 500 });
  }
}
