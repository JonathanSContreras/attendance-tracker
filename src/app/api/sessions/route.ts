import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/sessions -> list of dates we have (for admin date picker)
export async function GET() {
  const sessions = await prisma.session.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(sessions);
}

// POST /api/sessions { date: "YYYY-MM-DD" } -> ensure session exists
function normalizeDateOnly(dateStr: string) {
  // Parse YYYY-MM-DD format without timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function POST(req: Request) {
  const { date } = await req.json();
  if (!date) return NextResponse.json({ ok: false, error: "date required" }, { status: 400 });
  const d = normalizeDateOnly(date);
  const s = await prisma.session.upsert({
    where: { date: d },
    update: {},
    create: { date: d },
  });
  return NextResponse.json({ ok: true, session: s });
}
