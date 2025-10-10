// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export async function POST(req) {
  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const emailRaw = (body.email || "").trim();
    const password = body.password;

    if (!emailRaw || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const email = emailRaw.toLowerCase();

    // ✅ Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // ✅ Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user in Prisma
    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    console.log("✅ New user registered:", newUser.email);

    // ✅ Redirect to sign-in after success
    const redirectUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(redirectUrl, { status: 303 }); // 303 = "See Other"
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
