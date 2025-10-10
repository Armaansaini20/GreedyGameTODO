// scripts/test-connect.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to DB');
  } catch (e) {
    console.error('Connect failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
