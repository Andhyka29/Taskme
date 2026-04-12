import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, name, password } = body;

    if (mode === "register") {
      if (!name || !password) {
        return NextResponse.json(
          { error: "Nama dan password harus diisi" },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { name },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Nama sudah terdaftar" },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          name,
          password,
        },
        select: {
          id: true,
          name: true,
        },
      });

      return NextResponse.json({ success: true, user });
    }

    if (mode === "login") {
      if (!name || !password) {
        return NextResponse.json(
          { error: "Nama dan password harus diisi" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { name },
      });

      if (!user || user.password !== password) {
        return NextResponse.json(
          { error: "Nama atau password salah" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
        },
      });
    }

    return NextResponse.json(
      { error: "Mode tidak valid" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}