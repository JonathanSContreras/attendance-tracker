import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isDateKey, parseDateOnly } from "@/lib/dates";

type CheckinBody = { studentId?: unknown; sessionDate?: unknown };

function parseBody(body: CheckinBody) {
  const { studentId, sessionDate } = body;
  if (typeof studentId !== "number" || !Number.isInteger(studentId) || !isDateKey(sessionDate)) {
    return null;
  }
  return { studentId, date: parseDateOnly(sessionDate) };
}

// POST /api/checkin { studentId, sessionDate: "YYYY-MM-DD" }
export async function POST(req: Request) {
  const parsed = parseBody(await req.json());
  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "studentId (number) and sessionDate (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  const session = await prisma.session.upsert({
    where: { date: parsed.date },
    update: {},
    create: { date: parsed.date },
  });

  try {
    await prisma.checkin.create({
      data: { studentId: parsed.studentId, sessionId: session.id },
    });
  } catch (err) {
    // The @@unique([studentId, sessionId]) constraint rejects double check-ins,
    // including two taps that race each other.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Already checked in" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/checkin { studentId, sessionDate: "YYYY-MM-DD" } -> undo a check-in
export async function DELETE(req: Request) {
  const parsed = parseBody(await req.json());
  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "studentId (number) and sessionDate (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  const session = await prisma.session.findUnique({ where: { date: parsed.date } });
  if (!session) {
    return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
  }

  const deleted = await prisma.checkin.deleteMany({
    where: { studentId: parsed.studentId, sessionId: session.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ ok: false, error: "Check-in not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
