/* Idempotent demo seed. Run with: npx tsx src/db/seed.ts */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const { users, courses, modules, lessons, enrollments } = schema;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, "teacher@edulanka.lk")).limit(1);
  if (existing.length) {
    console.log("Seed already applied, skipping.");
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const [teacher] = await db
    .insert(users)
    .values({ name: "Nimali Perera", email: "teacher@edulanka.lk", passwordHash, role: "admin" })
    .returning();
  const [student] = await db
    .insert(users)
    .values({ name: "Kasun Silva", email: "student@edulanka.lk", passwordHash, role: "student" })
    .returning();

  const [c1] = await db
    .insert(courses)
    .values({
      title: "Introduction to Programming with Python",
      titleSi: "Python සමඟ ක්‍රමලේඛනය හැඳින්වීම",
      description:
        "Start your coding journey. Learn variables, loops, functions and build your first small programs step by step.",
      descriptionSi:
        "ඔබේ කේතකරණ ගමන ආරම්භ කරන්න. විචල්‍ය, ලූප, ශ්‍රිත ඉගෙන ගෙන පියවරෙන් පියවර ඔබේ පළමු කුඩා වැඩසටහන් ගොඩනඟන්න.",
      createdBy: teacher.id,
      published: true,
    })
    .returning();

  const [c2] = await db
    .insert(courses)
    .values({
      title: "Web Development Fundamentals",
      titleSi: "වෙබ් සංවර්ධන මූලධර්ම",
      description: "HTML, CSS and JavaScript essentials to build responsive, modern websites from scratch.",
      descriptionSi: "මුල සිටම ප්‍රතිචාරාත්මක, නවීන වෙබ් අඩවි ගොඩනැගීමට HTML, CSS සහ JavaScript අත්‍යවශ්‍ය කරුණු.",
      createdBy: teacher.id,
      published: true,
    })
    .returning();

  const [c3] = await db
    .insert(courses)
    .values({
      title: "Mathematics for O/L: Algebra",
      titleSi: "සා/පෙළ ගණිතය: වීජ ගණිතය",
      description: "Clear explanations of algebraic expressions, equations and graphs for O/L students.",
      descriptionSi: "සා/පෙළ සිසුන් සඳහා වීජීය ප්‍රකාශන, සමීකරණ සහ ප්‍රස්තාර පිළිබඳ පැහැදිලි විස්තර.",
      createdBy: teacher.id,
      published: true,
    })
    .returning();

  // Course 1 content
  const [m1] = await db.insert(modules).values({ courseId: c1.id, title: "Getting Started", titleSi: "ආරම්භය", position: 1 }).returning();
  const [m2] = await db.insert(modules).values({ courseId: c1.id, title: "Control Flow", titleSi: "පාලන ප්‍රවාහය", position: 2 }).returning();
  await db.insert(lessons).values([
    {
      moduleId: m1.id,
      title: "What is Python? Installing & your first program",
      titleSi: "Python යනු කුමක්ද? ස්ථාපනය සහ ඔබේ පළමු වැඩසටහන",
      description: "Overview of Python and writing 'Hello, World!'.",
      descriptionSi: "Python පිළිබඳ දළ විශ්ලේෂණයක් සහ 'Hello, World!' ලිවීම.",
      youtubeUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
      youtubeId: "kqtD5dpn9C8",
      position: 1,
    },
    {
      moduleId: m1.id,
      title: "Variables and Data Types",
      titleSi: "විචල්‍ය සහ දත්ත වර්ග",
      description: "Numbers, strings, booleans and how to store values.",
      youtubeUrl: "https://youtu.be/_uQrJ0TkZlc",
      youtubeId: "_uQrJ0TkZlc",
      position: 2,
    },
    {
      moduleId: m2.id,
      title: "If statements and conditions",
      titleSi: "If ප්‍රකාශ සහ කොන්දේසි",
      description: "Make decisions in your programs.",
      youtubeUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
      youtubeId: "rfscVS0vtbw",
      position: 1,
    },
    {
      moduleId: m2.id,
      title: "Loops: for and while",
      titleSi: "ලූප: for සහ while",
      description: "Repeat actions efficiently.",
      youtubeUrl: "https://www.youtube.com/watch?v=8ext9G7xspg",
      youtubeId: "8ext9G7xspg",
      position: 2,
    },
  ]);

  // Course 2 content
  const [m3] = await db.insert(modules).values({ courseId: c2.id, title: "HTML Basics", titleSi: "HTML මූලික කරුණු", position: 1 }).returning();
  const [m4] = await db.insert(modules).values({ courseId: c2.id, title: "Styling with CSS", titleSi: "CSS සමඟ මෝස්තර", position: 2 }).returning();
  await db.insert(lessons).values([
    {
      moduleId: m3.id,
      title: "HTML Crash Course",
      titleSi: "HTML කඩිනම් පාඨමාලාව",
      youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
      youtubeId: "UB1O30fR-EE",
      position: 1,
    },
    {
      moduleId: m4.id,
      title: "CSS Crash Course",
      titleSi: "CSS කඩිනම් පාඨමාලාව",
      youtubeUrl: "https://www.youtube.com/watch?v=yfoY53QXEnI",
      youtubeId: "yfoY53QXEnI",
      position: 1,
    },
    {
      moduleId: m4.id,
      title: "Flexbox in 15 minutes",
      titleSi: "මිනිත්තු 15කින් Flexbox",
      youtubeUrl: "https://www.youtube.com/watch?v=fYq5PXgSsbE",
      youtubeId: "fYq5PXgSsbE",
      position: 2,
    },
  ]);

  // Course 3 content
  const [m5] = await db.insert(modules).values({ courseId: c3.id, title: "Algebraic Expressions", titleSi: "වීජීය ප්‍රකාශන", position: 1 }).returning();
  await db.insert(lessons).values([
    {
      moduleId: m5.id,
      title: "Introduction to Algebra",
      titleSi: "වීජ ගණිතය හැඳින්වීම",
      youtubeUrl: "https://www.youtube.com/watch?v=NybHckSEQBI",
      youtubeId: "NybHckSEQBI",
      position: 1,
    },
    {
      moduleId: m5.id,
      title: "Solving Linear Equations",
      titleSi: "රේඛීය සමීකරණ විසඳීම",
      youtubeUrl: "https://www.youtube.com/watch?v=Qyd_v3DGzTM",
      youtubeId: "Qyd_v3DGzTM",
      position: 2,
    },
  ]);

  await db.insert(enrollments).values([
    { userId: student.id, courseId: c1.id, status: "approved" },
    { userId: student.id, courseId: c2.id, status: "pending" },
  ]);

  console.log("Seeded demo data.");
  console.log("  Teacher: teacher@edulanka.lk / password123");
  console.log("  Student: student@edulanka.lk / password123");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
