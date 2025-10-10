import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: token.sub }, select: { id:true, name:true, email:true, image:true, role:true, createdAt:true }});
  return NextResponse.json(user);
}
