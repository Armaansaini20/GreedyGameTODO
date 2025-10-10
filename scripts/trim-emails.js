// scripts/trim-emails.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true }});
    console.log('Found', users.length, 'users. Will trim whitespace from emails where needed.');

    let changed = 0;
    for (const u of users) {
      if (u.email && (u.email.trim() !== u.email)) {
        const clean = u.email.trim();
        console.log(`Trimming: id=${u.id} before="${u.email}" after="${clean}"`);
        await prisma.user.update({
          where: { id: u.id },
          data: { email: clean }
        });
        changed++;
      }
    }

    console.log('Done. Emails changed:', changed);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
