import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalizeDateOnly(dateStr: string) {
  // Parse YYYY-MM-DD format without timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ ok: false, error: "date required" }, { status: 400 });

  const d = normalizeDateOnly(date);
  const session = await prisma.session.findUnique({ where: { date: d } });
  if (!session) return NextResponse.json({ ok: true, studentIds: [] });

  const checkins = await prisma.checkin.findMany({
    where: { sessionId: session.id },
    select: { studentId: true },
  });

  return NextResponse.json({ ok: true, studentIds: checkins.map(c => c.studentId) });
}
