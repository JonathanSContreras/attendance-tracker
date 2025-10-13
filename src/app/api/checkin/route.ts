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
