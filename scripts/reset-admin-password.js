// scripts/reset-admin-password.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    const adminEmail = process.env.TARGET_ADMIN_EMAIL || 'admin@gmail.com';
    const newPw = process.env.NEW_PW || 'supersecret';
    const rounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS, 10) : 10;

    const user = await prisma.user.findUnique({ where: { email: adminEmail }});
    if (!user) {
      console.error('User not found for email:', adminEmail);
      process.exit(1);
    }

    const hashed = await bcrypt.hash(newPw, rounds);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    });

    console.log(`Password reset for ${adminEmail}. Use password: ${newPw}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
