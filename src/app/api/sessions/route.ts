import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDateKey, parseDateOnly, toDateKey } from "@/lib/dates";

// GET /api/sessions -> [{ id, date: "YYYY-MM-DD" }]
export async function GET() {
  const sessions = await prisma.session.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(sessions.map((s) => ({ id: s.id, date: toDateKey(s.date) })));
}

// POST /api/sessions { date: "YYYY-MM-DD" } -> create the session if it doesn't exist
export async function POST(req: Request) {
  const { date } = await req.json();
  if (!isDateKey(date)) {
    return NextResponse.json({ ok: false, error: "date (YYYY-MM-DD) required" }, { status: 400 });
  }

  const d = parseDateOnly(date);
  const session = await prisma.session.upsert({
    where: { date: d },
    update: {},
    create: { date: d },
  });
  return NextResponse.json({ ok: true, session: { id: session.id, date: toDateKey(session.date) } });
}
