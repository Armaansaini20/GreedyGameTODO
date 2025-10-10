import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  const now = new Date();
  const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const upcoming = await prisma.todo.findMany({
    where: {
      userId: user.id,
      completed: false,
      scheduledAt: { gte: now, lte: in4h },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  const completed = await prisma.todo.findMany({
    where: { userId: user.id, completed: true },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({ upcoming, completed });
}
