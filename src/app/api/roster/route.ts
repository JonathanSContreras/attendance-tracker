// src/app/api/roster/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    select: { id: true, sid: true, name: true, email: true },
  });
  return NextResponse.json(students);
}
