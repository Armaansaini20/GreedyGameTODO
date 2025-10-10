// scripts/find-and-fix-admin.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function showCodepoints(s) {
  if (!s) return '(empty)';
  // show hex code points and reveal invisible chars
  return Array.from(s).map(c => {
    const cp = c.codePointAt(0);
    return cp > 127 ? `U+${cp.toString(16).toUpperCase()}` : `${cp}('${c}')`;
  }).join(' ');
}

(async () => {
  try {
    console.log('cwd:', process.cwd());
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const users = await prisma.user.findMany();
    console.log('Users found in DB:', users.length);
    users.forEach(u => {
      console.log('---');
      console.log('id:', u.id);
      console.log('email (raw):', u.email);
      console.log('email (codepoints):', showCodepoints(u.email));
      console.log('email length:', u.email ? u.email.length : 0);
      console.log('role:', u.role);
      console.log('password present:', !!u.password);
    });

    const wanted = process.env.CHECK_USER_EMAIL || 'admin@gmail.com';
    console.log('\nSearching for:', JSON.stringify(wanted), 'codepoints ->', showCodepoints(wanted));

    // 1) exact findUnique
    let user = await prisma.user.findUnique({ where: { email: wanted }});
    console.log('findUnique by email ->', !!user);

    // 2) findFirst case-insensitive (if provider supports)
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: wanted, mode: 'insensitive' } }
      });
      console.log('findFirst equals (insensitive) ->', !!user);
    } catch (e) {
      console.log('findFirst insensitive not supported / errored:', e.message);
    }

    // 3) findFirst contains
    user = await prisma.user.findFirst({
      where: { email: { contains: 'admin', mode: 'insensitive' } }
    });
    console.log("findFirst contains 'admin' ->", !!user, user ? user.email : null);

    // 4) if not found by queries, try find by id if user id provided by env
    if (!user && process.env.CHECK_USER_ID) {
      user = await prisma.user.findUnique({ where: { id: process.env.CHECK_USER_ID }});
      console.log('findUnique by id ->', !!user);
    }

    if (!user) {
      console.log('\nNo user matched by the above queries. Printing all emails again to inspect visually.');
      users.forEach(u => console.log(u.id, JSON.stringify(u.email)));
      console.log('\nIf you see the admin email above but queries failed, it likely has hidden characters. You can run the script again with CHECK_USER_ID set to that id to update the record.');
      process.exit(0);
    }

    console.log('\nMatched user:');
    console.log('id:', user.id, 'email:', JSON.stringify(user.email));
    console.log('codepoints:', showCodepoints(user.email));

    if (process.env.DO_FIX === '1') {
      // will sanitize email and set new password
      const cleanEmail = process.env.CLEAN_EMAIL || 'admin@gmail.com';
      const newPw = process.env.NEW_PW || 'supersecret';
      const rounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS, 10) : 10;

      console.log('\nApplying fixes:');
      console.log(' - new email:', cleanEmail);
      console.log(' - new password (plain):', newPw);
      console.log(' - bcrypt rounds:', rounds);

      const hashed = await bcrypt.hash(newPw, rounds);

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { email: cleanEmail, password: hashed },
      });

      console.log('Updated user id:', updated.id, 'new email:', updated.email);
      console.log('Password field length:', updated.password ? updated.password.length : 'none');
    } else {
      console.log('\nDO_FIX not enabled. To clean the email and reset password set environment variables:');
      console.log('  DO_FIX=1 CLEAN_EMAIL=admin@gmail.com NEW_PW=supersecret node scripts/find-and-fix-admin.js');
      console.log('Or on PowerShell: $env:DO_FIX="1"; $env:CLEAN_EMAIL="admin@gmail.com"; $env:NEW_PW="supersecret"; node scripts/find-and-fix-admin.js');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
