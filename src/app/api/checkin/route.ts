import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalizeDateOnly(dateStr: string) {
  // Parse YYYY-MM-DD format without timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function POST(req: Request) {
  const { studentId, sessionDate } = await req.json();
  if (!studentId || !sessionDate) {
    return NextResponse.json(
      { ok: false, error: "studentId and sessionDate required" },
      { status: 400 }
    );
  }

  const d = normalizeDateOnly(sessionDate);

  // Ensure session exists
  const session = await prisma.session.upsert({
    where: { date: d },
    update: {},
    create: { date: d },
  });

  // Check if already checked in
  const existing = await prisma.checkin.findUnique({
    where: { studentId_sessionId: { studentId, sessionId: session.id } },
  });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Already checked in" }, { status: 400 });
  }

  // Create checkin
  await prisma.checkin.create({
    data: { studentId, sessionId: session.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { studentId, sessionDate } = await req.json();
  if (!studentId || !sessionDate) {
    return NextResponse.json(
      { ok: false, error: "studentId and sessionDate required" },
      { status: 400 }
    );
  }

  const d = normalizeDateOnly(sessionDate);

  // Find the session
  const session = await prisma.session.findUnique({
    where: { date: d },
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
  }

  // Delete the checkin
  const deleted = await prisma.checkin.deleteMany({
    where: {
      studentId,
      sessionId: session.id,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ ok: false, error: "Check-in not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
