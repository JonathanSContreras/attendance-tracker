import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/roster -> every student, alphabetical
export async function GET() {
  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    select: { id: true, sid: true, name: true, email: true },
  });
  return NextResponse.json(students);
}
