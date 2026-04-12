import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

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

    const today = new Date();
    const startOfDay = getStartOfDay(today);
    const endOfDay = getEndOfDay(today);

    const reflection = await prisma.reflection.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        content: true,
        mood: true,
        date: true,
      },
    });

    return NextResponse.json({ success: true, reflection: reflection || null });
  } catch (error) {
    console.error("Get reflection error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, mood, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    const today = new Date();
    const startOfDay = getStartOfDay(today);
    const endOfDay = getEndOfDay(today);

    const existingReflection = await prisma.reflection.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let reflection;
    if (existingReflection) {
      reflection = await prisma.reflection.update({
        where: { id: existingReflection.id },
        data: {
          content: content || existingReflection.content,
          mood: mood || existingReflection.mood,
        },
        select: {
          id: true,
          content: true,
          mood: true,
          date: true,
        },
      });
    } else {
      reflection = await prisma.reflection.create({
        data: {
          content: content || "",
          mood: mood || "",
          userId,
        },
        select: {
          id: true,
          content: true,
          mood: true,
          date: true,
        },
      });
    }

    return NextResponse.json({ success: true, reflection });
  } catch (error) {
    console.error("Save reflection error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}