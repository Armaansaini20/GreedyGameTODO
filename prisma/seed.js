// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_SUPER_EMAIL || 'admin@gmail.com';
  const pw = process.env.SEED_SUPER_PW || 'supersecret';
  const hashed = await bcrypt.hash(pw, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('Superuser already exists:', existing.email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      password: hashed, // 👈 hashed password here
      role: 'SUPER',
    },
  });

  console.log('Created superuser:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
