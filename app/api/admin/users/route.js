// app/api/admin/users/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  if (session.user.role !== 'SUPER') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  return new Response(JSON.stringify(users), { status: 200 });
}
