import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";

export async function GET() {
  // pull data
  const students = await prisma.student.findMany({ orderBy: { name: "asc" } });
  const sessions  = await prisma.session.findMany({ orderBy: { date: "asc" } });
  const checkins  = await prisma.checkin.findMany({ select: { studentId: true, sessionId: true } });

  // date headers as YYYY-MM-DD strings
  const dateHeaders = sessions.map(s => s.date.toISOString().slice(0,10));

  // quick lookup: Set of "studentId|sessionId" for presence
  const present = new Set(checkins.map(c => `${c.studentId}|${c.sessionId}`));

  // build rows: A=ID (sid), B=Name, C=Email, then dates
  const rows: Record<string, any>[] = students.map(st => {
    const row: Record<string, any> = {
      ID: st.sid,
      Name: st.name,
      Email: st.email,
    };
    for (const [i, sess] of sessions.entries()) {
      const key = `${st.id}|${sess.id}`;
      row[dateHeaders[i]] = present.has(key) ? "present" : "absent";
    }
    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["ID","Name","Email", ...dateHeaders] });
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance_export.xlsx"`,
    },
  });
}
