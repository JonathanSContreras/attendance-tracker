import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { isDateKey, parseDateOnly, startOfDay } from "@/lib/dates";

type SheetRow = Record<string, unknown>;

const PRESENT_VALUES = new Set(["present", "p", "x", "1", "yes", "y"]);

/** Interpret a column header as a session date, or return null if it isn't one. */
function parseHeaderDate(header: string): Date | null {
  const h = header.trim();
  if (isDateKey(h)) return parseDateOnly(h);

  // Excel serial date (days since 1899-12-30)
  if (/^\d+(\.\d+)?$/.test(h)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(h) * 86_400_000);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  // Anything else Date can parse, e.g. "10/13/25" or "Oct 13 2025"
  const t = Date.parse(h);
  return Number.isNaN(t) ? null : startOfDay(new Date(t));
}

function isPresent(val: unknown): boolean {
  return PRESENT_VALUES.has(String(val ?? "").trim().toLowerCase());
}

// POST /api/import (multipart, field "file") -> upsert students, sessions, and historical attendance
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
  }

  const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<SheetRow>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "Empty sheet" }, { status: 400 });
  }

  const headers = Object.keys(rows[0]);
  const findHeader = (name: string) => headers.find((h) => h.trim().toLowerCase() === name);
  const idHeader = findHeader("id");
  const nameHeader = findHeader("name");
  const emailHeader = findHeader("email");
  if (!idHeader || !nameHeader || !emailHeader) {
    return NextResponse.json(
      { ok: false, error: "Missing required headers: ID, Name, Email" },
      { status: 400 }
    );
  }

  // Every other column whose header parses as a date is a past session.
  const dateColumns = headers
    .filter((h) => h !== idHeader && h !== nameHeader && h !== emailHeader)
    .map((header) => ({ header, date: parseHeaderDate(header) }))
    .filter((c): c is { header: string; date: Date } => c.date !== null);

  const result = await prisma.$transaction(
    async (tx) => {
      const sessionIds = new Map<string, number>();
      for (const { header, date } of dateColumns) {
        const s = await tx.session.upsert({
          where: { date },
          update: {},
          create: { date },
          select: { id: true },
        });
        sessionIds.set(header, s.id);
      }

      let imported = 0;
      for (const row of rows) {
        const sid = String(row[idHeader]).trim();
        const name = String(row[nameHeader]).trim();
        const email = String(row[emailHeader]).trim();
        if (!sid || !name || !email) continue;

        const student = await tx.student.upsert({
          where: { email },
          update: { sid, name },
          create: { sid, name, email },
          select: { id: true },
        });
        imported++;

        for (const { header } of dateColumns) {
          if (!isPresent(row[header])) continue;
          const sessionId = sessionIds.get(header)!;
          await tx.checkin.upsert({
            where: { studentId_sessionId: { studentId: student.id, sessionId } },
            update: {},
            create: { studentId: student.id, sessionId },
          });
        }
      }

      return { imported, sessions: sessionIds.size };
    },
    { timeout: 30_000 }
  );

  return NextResponse.json({ ok: true, ...result });
}
