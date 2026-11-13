import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDateKey, parseDateOnly } from "@/lib/dates";

// POST /api/clear { date: "YYYY-MM-DD" } -> delete a session and all of its check-ins
export async function POST(req: Request) {
  const { date } = await req.json();
  if (!isDateKey(date)) {
    return NextResponse.json({ ok: false, error: "date (YYYY-MM-DD) required" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { date: parseDateOnly(date) } });
  if (!session) {
    return NextResponse.json({ ok: true, cleared: 0, message: "No session for that date" });
  }

  const [result] = await prisma.$transaction([
    prisma.checkin.deleteMany({ where: { sessionId: session.id } }),
    prisma.session.delete({ where: { id: session.id } }),
  ]);

  return NextResponse.json({ ok: true, cleared: result.count });
}
