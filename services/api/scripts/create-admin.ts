import { PrismaClient, UserRole, KYCStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@escrow.com';
const ADMIN_PASSWORD = 'password123';

async function main() {
  console.log('🔐 Creating admin user...\n');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roles: [UserRole.ADMIN],
      kycStatus: KYCStatus.VERIFIED,
      isActive: true,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roles: [UserRole.ADMIN],
      kycStatus: KYCStatus.VERIFIED,
      isActive: true,
    },
  });

  console.log(`  ✅ Admin user: ${admin.email} (ID: ${admin.id})`);

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      currency: 'GHS',
      availableCents: 0,
      pendingCents: 0,
    },
  });

  console.log('  ✅ Wallet created for admin\n');
  console.log('📧 Email:', ADMIN_EMAIL);
  console.log('🔑 Password:', ADMIN_PASSWORD);
  console.log('\n✅ Done. You can sign in at /login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
