// Seeds the database with a fictional class so the app can be explored without real student data.
// Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIRST = ["Ava", "Liam", "Maya", "Noah", "Zoe", "Ethan", "Priya", "Lucas", "Sofia", "Mateo",
  "Hana", "Omar", "Chloe", "Diego", "Nia", "Ryan", "Leila", "Owen", "Grace", "Kai"];
const LAST = ["Nguyen", "Patel", "Garcia", "Kim", "Johnson", "Okafor", "Silva", "Chen", "Rossi", "Haddad",
  "Tanaka", "Lopez", "Murphy", "Singh", "Reyes", "Novak", "Ahmed", "Brooks", "Ward", "Ibarra"];

function localMidnight(daysAgo) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysAgo);
}

async function main() {
  const students = [];
  for (let i = 0; i < FIRST.length; i++) {
    const name = `${FIRST[i]} ${LAST[i]}`;
    const sid = String(100200 + i * 37);
    const email = `${FIRST[i]}.${LAST[i]}@example.edu`.toLowerCase();
    students.push(
      await prisma.student.upsert({ where: { email }, update: { sid, name }, create: { sid, name, email } })
    );
  }

  // Four past class meetings, one per week, with ~85% attendance (deterministic).
  for (let week = 1; week <= 4; week++) {
    const date = localMidnight(week * 7);
    const session = await prisma.session.upsert({ where: { date }, update: {}, create: { date } });
    for (const [i, student] of students.entries()) {
      if ((i * 7 + week * 3) % 7 === 0) continue; // absent
      await prisma.checkin.upsert({
        where: { studentId_sessionId: { studentId: student.id, sessionId: session.id } },
        update: {},
        create: { studentId: student.id, sessionId: session.id },
      });
    }
  }

  console.log(`Seeded ${students.length} students and 4 past sessions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
