import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  const body = await req.json();

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (todo.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updated = await prisma.todo.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (todo.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
