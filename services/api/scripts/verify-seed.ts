import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying seeded data...\n');

  try {
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}`);
    const buyers = await prisma.user.count({ where: { roles: { has: 'BUYER' } } });
    const sellers = await prisma.user.count({ where: { roles: { has: 'SELLER' } } });
    console.log(`   • Buyers: ${buyers}`);
    console.log(`   • Sellers: ${sellers}`);

    // Check wallets
    const walletCount = await prisma.wallet.count();
    console.log(`\n💰 Wallets: ${walletCount}`);
    const walletsWithBalance = await prisma.wallet.count({
      where: { availableCents: { gt: 0 } },
    });
    console.log(`   • Wallets with balance: ${walletsWithBalance}`);

    // Check escrows
    const escrowCount = await prisma.escrowAgreement.count();
    console.log(`\n📦 Escrows: ${escrowCount}`);
    const escrowsByStatus = await prisma.escrowAgreement.groupBy({
      by: ['status'],
      _count: true,
    });
    escrowsByStatus.forEach(({ status, _count }) => {
      console.log(`   • ${status}: ${_count}`);
    });

    // Check milestones
    const milestoneCount = await prisma.escrowMilestone.count();
    console.log(`\n🎯 Milestones: ${milestoneCount}`);
    const completedMilestones = await prisma.escrowMilestone.count({
      where: { status: 'completed' },
    });
    console.log(`   • Completed: ${completedMilestones}`);

    // Check messages
    const messageCount = await prisma.escrowMessage.count();
    console.log(`\n💬 Messages: ${messageCount}`);

    // Check evidence
    const evidenceCount = await prisma.evidence.count();
    console.log(`\n📎 Evidence: ${evidenceCount}`);

    // Check disputes
    const disputeCount = await prisma.dispute.count();
    console.log(`\n⚠️  Disputes: ${disputeCount}`);
    const openDisputes = await prisma.dispute.count({
      where: { status: 'OPEN' },
    });
    console.log(`   • Open: ${openDisputes}`);

    // Check withdrawals
    const withdrawalCount = await prisma.withdrawal.count();
    console.log(`\n💸 Withdrawals: ${withdrawalCount}`);

    // Summary
    console.log('\n✅ Verification complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Total Users: ${userCount}`);
    console.log(`   • Total Escrows: ${escrowCount}`);
    console.log(`   • Total Wallets: ${walletCount}`);
    console.log(`   • Total Messages: ${messageCount}`);
    console.log(`   • Total Evidence: ${evidenceCount}`);
    console.log(`   • Total Disputes: ${disputeCount}`);
    console.log(`   • Total Withdrawals: ${withdrawalCount}`);

    if (userCount >= 10 && escrowCount >= 8) {
      console.log('\n🎉 Seed data looks good!');
    } else {
      console.log('\n⚠️  Seed data may be incomplete. Run seed script again.');
    }
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

