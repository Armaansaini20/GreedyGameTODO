// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export async function POST(req) {
  try {
    // Detect JSON body vs form submission
    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    const isJson = contentType.includes("application/json");

    // parse body accordingly
    let body;
    if (isJson) {
      body = await req.json();
    } else {
      // form submission (x-www-form-urlencoded or multipart)
      const form = await req.formData();
      body = {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      };
    }

    const name = (body.name || "").toString().trim();
    const emailRaw = (body.email || "").toString().trim();
    const password = body.password;

    // validation
    if (!emailRaw || !password) {
      const payload = { error: "Email and password are required." };
      if (isJson) return NextResponse.json(payload, { status: 400 });

      // for form submits, redirect back to sign-up with an error query param
      const url = new URL("/sign-up", req.url);
      url.searchParams.set("error", "missing_fields");
      return NextResponse.redirect(url, { status: 303 });
    }

    const email = emailRaw.toLowerCase();

    // check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const payload = { error: "User already exists. Please sign in." };
      if (isJson) return NextResponse.json(payload, { status: 409 });

      const url = new URL("/sign-in", req.url);
      url.searchParams.set("error", "exists");
      return NextResponse.redirect(url, { status: 303 });
    }

    // hash password and create
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    console.log("✅ New user registered:", newUser.email);

    // If the request came via fetch(JSON) return JSON with redirect URL
    if (isJson) {
      return NextResponse.json({ ok: true, redirect: "/sign-in" }, { status: 201 });
    }

    // Otherwise (a plain form submit) issue a 303 redirect so browser follows it
    const redirectUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);

    // For JSON clients, return JSON error; for form submits redirect back to sign-up
    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    const isJson = contentType.includes("application/json");
    if (isJson) {
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
    const url = new URL("/sign-up", req.url);
    url.searchParams.set("error", "server_error");
    return NextResponse.redirect(url, { status: 303 });
  }
}
