// scripts/check-user.js
require('dotenv').config(); // <-- ensure .env is loaded for scripts
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  console.log('NODE CWD:', process.cwd());
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

  const prisma = new PrismaClient();

  try {
    // List all users (helpful to see what's in the DB you're connecting to)
    const all = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true }});
    console.log('Users found in DB:', all.length);
    all.forEach(u => console.log(' -', u.email, u.role, u.id));

    const email = process.env.CHECK_USER_EMAIL || 'admin@gmail.com';
    const plain = process.env.CHECK_USER_PW || 'supersecret';

    const user = await prisma.user.findUnique({ where: { email }});
    if (!user) {
      console.log('User not found:', email);
      return process.exit(1);
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role });
    console.log('Password field length:', user.password ? user.password.length : 'none');
    if (!user.password) {
      console.log('Password missing for user. Seed again with hashed password.');
      return process.exit(1);
    }

    const ok = await bcrypt.compare(plain, user.password);
    console.log('bcrypt.compare result for provided plain password:', ok);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
