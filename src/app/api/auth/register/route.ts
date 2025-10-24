import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

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

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        phoneNumber: data.phoneNumber,
      },
    });

    return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ error: "Registrasi gagal. Coba lagi nanti." }, { status: 500 });
  }
}
