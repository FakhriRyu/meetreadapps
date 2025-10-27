import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { SESSION_COOKIE_NAME, createSessionCookie } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const UpdateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").optional(),
    email: z.string().trim().email("Email tidak valid").optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^62\d{8,15}$/, "Nomor telepon harus diawali 62 dan minimal 10 digit")
      .optional()
      .or(z.literal("")),
    profileImage: z
      .string()
      .trim()
      .url("URL foto profil tidak valid")
      .or(z.literal(""))
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Tidak ada perubahan yang diberikan.",
  });

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sanitized = {
      ...body,
      phoneNumber:
        typeof body.phoneNumber === "string"
          ? body.phoneNumber.replace(/\s+/g, "")
          : body.phoneNumber,
    };
    const data = UpdateProfileSchema.parse(sanitized);

    const updateData: {
      name?: string;
      email?: string;
      phoneNumber?: string | null;
      profileImage?: string | null;
    } = {};

    if (typeof data.name === "string") {
      updateData.name = data.name;
    }
    if (typeof data.email === "string") {
      updateData.email = data.email.toLowerCase();
    }
    if (typeof data.phoneNumber === "string") {
      updateData.phoneNumber = data.phoneNumber.length > 0 ? data.phoneNumber : null;
    }
    if (typeof data.profileImage === "string") {
      const trimmed = data.profileImage.trim();
      updateData.profileImage = trimmed.length > 0 ? trimmed : null;
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
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

    const session = createSessionCookie({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    });

    const response = NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phoneNumber: updated.phoneNumber,
        profileImage: updated.profileImage,
        joinedAt: updated.createdAt,
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

    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}
