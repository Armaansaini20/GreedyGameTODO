// app/api/todos/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route'; // path relative to this file

// Reuse Prisma client in dev
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) global.__prisma = new PrismaClient();
  prisma = global.__prisma;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json([], { status: 401 });
  }

  try {
    // Prefer filtering by userId if available in session
    // session.user.id should be populated by your NextAuth session callback
    let todos;
    if (session.user.id) {
      // try userId field (most schemas will have userId)
      try {
        todos = await prisma.todo.findMany({
          where: { userId: session.user.id },
          orderBy: { scheduledAt: 'asc' },
        });
      } catch (e) {
        // fallback to relation by email
        todos = await prisma.todo.findMany({
          where: { user: { email: session.user.email } },
          orderBy: { scheduledAt: 'asc' },
        });
      }
    } else {
      // fallback: query by user relation email
      todos = await prisma.todo.findMany({
        where: { user: { email: session.user.email } },
        orderBy: { scheduledAt: 'asc' },
      });
    }

    return NextResponse.json(todos);
  } catch (err) {
    console.error('Error fetching todos:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, scheduledAt } = body || {};

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: 'Title and scheduledAt are required' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt' }, { status: 400 });
    }
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'scheduledAt must be in the future' }, { status: 400 });
    }

    // Build create data - set relation by userId if available else connect by email
    let created;
    if (session.user.id) {
      // attempt to create with userId
      try {
        created = await prisma.todo.create({
          data: {
            title,
            description,
            scheduledAt: scheduledDate,
            userId: session.user.id,
          },
        });
      } catch (e) {
        // fallback to connecting by email relation
        created = await prisma.todo.create({
          data: {
            title,
            description,
            scheduledAt: scheduledDate,
            user: { connect: { email: session.user.email } },
          },
        });
      }
    } else {
      created = await prisma.todo.create({
        data: {
          title,
          description,
          scheduledAt: scheduledDate,
          user: { connect: { email: session.user.email } },
        },
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('Error creating todo:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
