import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    const reflections = await prisma.reflection.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
      select: {
        id: true,
        content: true,
        mood: true,
        date: true,
      },
    });

    return NextResponse.json({ success: true, reflections });
  } catch (error) {
    console.error("Get reflection history error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}