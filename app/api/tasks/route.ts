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

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        done: true,
        priority: true,
        deadline: true,
        category: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, userId, priority, deadline, category } = body;

    if (!text || !userId) {
      return NextResponse.json(
        { error: "Text dan user ID diperlukan" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        text: text.trim(),
        userId,
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        category: category || "Pribadi",
      },
      select: {
        id: true,
        text: true,
        done: true,
        priority: true,
        deadline: true,
        category: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskId, done } = body;

    if (taskId === undefined || done === undefined) {
      return NextResponse.json(
        { error: "Task ID dan status diperlukan" },
        { status: 400 }
      );
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { done },
      select: {
        id: true,
        text: true,
        done: true,
        priority: true,
        deadline: true,
        category: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID diperlukan" },
        { status: 400 }
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}