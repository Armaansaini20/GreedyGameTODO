// app/api/debug/db/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let prisma;
if (global.__prisma) {
  prisma = global.__prisma;
} else {
  prisma = new PrismaClient();
  if (process.env.NODE_ENV !== "production") global.__prisma = prisma;
}

export async function GET() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({ ok: true, result: res });
  } catch (err) {
    console.error("DB TEST ERROR:", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
