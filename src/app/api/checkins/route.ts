import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDateKey, parseDateOnly } from "@/lib/dates";

// GET /api/checkins?date=YYYY-MM-DD -> student ids checked in for that day, oldest first
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date");
  if (!isDateKey(date)) {
    return NextResponse.json({ ok: false, error: "date (YYYY-MM-DD) required" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { date: parseDateOnly(date) } });
  if (!session) return NextResponse.json({ ok: true, studentIds: [] });

  const checkins = await prisma.checkin.findMany({
    where: { sessionId: session.id },
    select: { studentId: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, studentIds: checkins.map((c) => c.studentId) });
}
