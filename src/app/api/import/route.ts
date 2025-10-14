import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";

function normalizeDateOnly(d: Date) {
  // Normalize to local midnight without timezone issues
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseExcelDates(header: string): Date | null {
  // Try JS/ISO-like
  const t = Date.parse(header);
  if (!Number.isNaN(t)) return normalizeDateOnly(new Date(t));

  // Try Excel serial number
  const n = Number(header);
  if (!Number.isNaN(n)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = n * 86400000;
    return normalizeDateOnly(new Date(epoch.getTime() + ms));
  }
  return null;
}

function isPresent(val: any): boolean {
  const s = String(val ?? "").trim().toLowerCase();
  // treat these as present; everything else (incl. empty) = absent
  return ["present", "p", "x", "1", "yes", "y"].includes(s);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  if (!rows.length) return NextResponse.json({ ok: false, error: "Empty sheet" }, { status: 400 });

  // Expect columns: A=ID, B=Name, C=Email. We’ll detect their headers.
  const headers = Object.keys(rows[0]).map(h => h.trim());
  const idHeader    = headers.find(h => h.toLowerCase() === "id");
  const nameHeader  = headers.find(h => h.toLowerCase() === "name");
  const emailHeader = headers.find(h => h.toLowerCase() === "email");

  if (!idHeader || !nameHeader || !emailHeader) {
    return NextResponse.json({ ok: false, error: "Missing required headers: ID, Name, Email" }, { status: 400 });
  }

  // Date headers are all columns after C (not ID/Name/Email)
  const dateHeaders = headers.filter(h => ![idHeader, nameHeader, emailHeader].includes(h));
  const sessionByISO = new Map<string, number>();

  // Upsert sessions (one per date col)
  for (const h of dateHeaders) {
    const d = parseExcelDates(h);
    if (!d) continue;
    const s = await prisma.session.upsert({
      where: { date: d },
      update: {},
      create: { date: d },
      select: { id: true, date: true }
    });
    sessionByISO.set(d.toISOString(), s.id);
  }

  // Upsert students + historical PRESENT marks
  for (const row of rows) {
    const sid   = String(row[idHeader]).trim();
    const name  = String(row[nameHeader]).trim();
    const email = String(row[emailHeader]).trim();
    if (!sid || !name || !email) continue;

    const student = await prisma.student.upsert({
      where: { email },
      update: { sid, name },
      create: { sid, name, email },
      select: { id: true }
    });

    for (const h of dateHeaders) {
      const d = parseExcelDates(h);
      if (!d) continue;
      if (!isPresent(row[h])) continue; // only create checkins for "present"

      const sessionId = sessionByISO.get(d.toISOString());
      if (!sessionId) continue;

      await prisma.checkin.upsert({
        where: { studentId_sessionId: { studentId: student.id, sessionId } },
        update: {},
        create: { studentId: student.id, sessionId }
      });
    }
  }

  return NextResponse.json({
    ok: true,
    students: await prisma.student.count(),
    sessions: sessionByISO.size
  });
}
