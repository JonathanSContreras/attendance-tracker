import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/dates";

// GET /api/export -> .xlsx with one row per student and one present/absent column per session
export async function GET() {
  const [students, sessions, checkins] = await Promise.all([
    prisma.student.findMany({ orderBy: { name: "asc" } }),
    prisma.session.findMany({ orderBy: { date: "asc" } }),
    prisma.checkin.findMany({ select: { studentId: true, sessionId: true } }),
  ]);

  const dateHeaders = sessions.map((s) => toDateKey(s.date));
  const present = new Set(checkins.map((c) => `${c.studentId}|${c.sessionId}`));

  const rows = students.map((st) => {
    const row: Record<string, string> = { ID: st.sid, Name: st.name, Email: st.email };
    sessions.forEach((sess, i) => {
      row[dateHeaders[i]] = present.has(`${st.id}|${sess.id}`) ? "present" : "absent";
    });
    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["ID", "Name", "Email", ...dateHeaders] });
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance_${toDateKey(new Date())}.xlsx"`,
    },
  });
}
