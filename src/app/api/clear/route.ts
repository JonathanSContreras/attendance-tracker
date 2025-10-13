import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalizeDateOnly(dateStr: string) {
  // Parse YYYY-MM-DD format without timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function POST(req: Request) {
  const { date } = await req.json();
  if (!date) return NextResponse.json({ ok: false, error: "date required" }, { status: 400 });

  const d = normalizeDateOnly(date);

  // Ensure session exists; if not, nothing to clear
  const session = await prisma.session.findUnique({ where: { date: d } });
  if (!session) return NextResponse.json({ ok: true, cleared: 0, message: "No session for that date" });

  // Delete all checkins for this session
  const result = await prisma.checkin.deleteMany({ where: { sessionId: session.id } });

  // Delete the session itself
  await prisma.session.delete({ where: { id: session.id } });

  return NextResponse.json({ ok: true, cleared: result.count });
}
