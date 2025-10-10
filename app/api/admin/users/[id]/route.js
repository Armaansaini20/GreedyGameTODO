// app/api/admin/users/[id]/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  if (session.user.role !== 'SUPER') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const id = params.id;
  const body = await req.json();
  const { role } = body;

  if (!['USER','SUPER'].includes(role)) {
    return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role }
  });

  return new Response(JSON.stringify({ id: updated.id, role: updated.role }), { status: 200 });
}
