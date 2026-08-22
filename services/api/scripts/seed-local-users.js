/**
 * Seed local admin + buyer for dashboard testing (no MinIO required).
 * Usage: DATABASE_URL=... node scripts/seed-local-users.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const PASSWORD = 'password123';

const USERS = [
  {
    email: 'admin@myxcrow.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['ADMIN'],
    phone: '0551000001',
    availableCents: 0,
  },
  {
    email: 'buyer1@test.com',
    firstName: 'John',
    lastName: 'Buyer',
    roles: ['BUYER'],
    phone: '0551000002',
    availableCents: 50000,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  console.log('Seeding local test users...\n');

  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: u.roles,
        kycStatus: 'VERIFIED',
        isActive: true,
        phone: u.phone,
      },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: u.roles,
        kycStatus: 'VERIFIED',
        isActive: true,
        phone: u.phone,
      },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { availableCents: u.availableCents },
      create: {
        userId: user.id,
        currency: 'GHS',
        availableCents: u.availableCents,
        pendingCents: 0,
      },
    });

    console.log(`  ${u.roles[0].padEnd(6)} ${u.email}  /  ${PASSWORD}  (${u.phone})`);
  }

  console.log('\nDone. Sign in at /login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
