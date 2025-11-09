import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Prisma } from "@prisma/client";

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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.email ? { email: data.email.toLowerCase() } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Data tidak valid." },
        { status: 400 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh pengguna lain." },
          { status: 409 },
        );
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal memperbarui data pengguna." }, { status: 500 });
  }
}
