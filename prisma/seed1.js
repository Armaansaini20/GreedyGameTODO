// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const pw = process.env.SEED_SUPER_PW || 'supersecret';
  const hashed = await bcrypt.hash(pw, 10);

  // Only create if not exists
  const existing = await prisma.user.findUnique({ where: { email: 'admin@example.com' }});

  if (existing) {
    console.log('Superuser already exists:', existing.email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashed,
      role: 'SUPER',
    }
  });

  console.log('Created superuser:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
