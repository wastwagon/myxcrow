import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, roles: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`\nTotal users: ${users.length}\n`);
  if (users.length === 0) {
    console.log('No users in database. Run: pnpm seed  (or pnpm create-admin for admin only)\n');
    return;
  }
  users.forEach((u) => {
    console.log(`  ${u.email}  roles=${u.roles.join(',')}  active=${u.isActive}`);
  });
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
