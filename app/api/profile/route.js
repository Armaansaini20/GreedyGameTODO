// app/api/profile/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) global.__prisma = new PrismaClient();
  prisma = global.__prisma;
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, avatarData } = body || {};

    const updateData = {};
    if (typeof name === 'string' && name.trim().length > 0) updateData.name = name.trim();

    if (typeof avatarData === 'string' && avatarData.trim().length > 0) {
      // Accept either URL or data URL — store directly in user.image
      updateData.image = avatarData.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // Use session.user.id when available, otherwise use email to locate user
    let updated;
    if (session.user.id) {
      updated = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: { id: true, name: true, email: true, image: true, role: true },
      });
    } else {
      updated = await prisma.user.update({
        where: { email: session.user.email },
        data: updateData,
        select: { id: true, name: true, email: true, image: true, role: true },
      });
    }

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const user = session.user;
    // Return session user info (fresh fetch from DB)
    let dbUser;
    if (session.user.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, image: true, role: true },
      });
    } else {
      dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, image: true, role: true },
      });
    }
    return NextResponse.json({ user: dbUser });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
