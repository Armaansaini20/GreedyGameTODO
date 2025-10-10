// scripts/create-super.js
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_EMAIL || 'admin@example.com';
  const pw = process.env.SUPER_PW || 'supersecret';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Super user already exists:', email);
    return;
  }

  const hash = await bcrypt.hash(pw, 10);
  const u = await prisma.user.create({
    data: {
      email,
      name: 'Super Admin',
      password: hash,
      role: 'SUPER',
    },
  });
  console.log('Created super user:', u.email, u.id);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
