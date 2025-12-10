import { PrismaClient, EscrowStatus, UserRole, KYCStatus, WithdrawalMethod, WithdrawalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USERS = [
  { email: 'buyer1@test.com', firstName: 'John', lastName: 'Buyer', role: UserRole.BUYER },
  { email: 'seller1@test.com', firstName: 'Jane', lastName: 'Seller', role: UserRole.SELLER },
  { email: 'buyer2@test.com', firstName: 'Mike', lastName: 'Customer', role: UserRole.BUYER },
  { email: 'seller2@test.com', firstName: 'Sarah', lastName: 'Merchant', role: UserRole.SELLER },
  { email: 'buyer3@test.com', firstName: 'David', lastName: 'Client', role: UserRole.BUYER },
  { email: 'seller3@test.com', firstName: 'Emma', lastName: 'Vendor', role: UserRole.SELLER },
  { email: 'buyer4@test.com', firstName: 'Chris', lastName: 'Purchaser', role: UserRole.BUYER },
  { email: 'seller4@test.com', firstName: 'Lisa', lastName: 'Provider', role: UserRole.SELLER },
  { email: 'buyer5@test.com', firstName: 'Tom', lastName: 'Acquirer', role: UserRole.BUYER },
  { email: 'seller5@test.com', firstName: 'Anna', lastName: 'Supplier', role: UserRole.SELLER },
];

async function main() {
  const PASSWORD_HASH = await bcrypt.hash('password123', 10);
  console.log('🌱 Starting seed script...\n');

  // Create users
  console.log('👥 Creating 10 users...');
  const createdUsers = [];
  for (const userData of USERS) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash: PASSWORD_HASH,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: [userData.role],
        kycStatus: KYCStatus.VERIFIED,
        isActive: true,
      },
    });
    createdUsers.push(user);
    console.log(`  ✅ Created user: ${user.email} (${userData.role})`);
  }

  // Create wallets for all users
  console.log('\n💰 Creating wallets...');
  for (const user of createdUsers) {
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        currency: 'GHS',
        availableCents: 0,
        pendingCents: 0,
      },
    });
    console.log(`  ✅ Created wallet for ${user.email}`);
  }

  // Fund some wallets
  console.log('\n💵 Funding wallets...');
  const buyers = createdUsers.filter((u) => u.role === UserRole.BUYER);
  const sellers = createdUsers.filter((u) => u.role === UserRole.SELLER);

  // Fund buyer wallets with different amounts
  const fundingAmounts = [50000, 100000, 75000, 150000, 200000]; // 500, 1000, 750, 1500, 2000 GHS
  for (let i = 0; i < buyers.length; i++) {
    const buyer = buyers[i];
    const amount = fundingAmounts[i] || 100000;
    const wallet = await prisma.wallet.findUnique({ where: { userId: buyer.id } });
    if (wallet) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { availableCents: amount },
      });
      console.log(`  ✅ Funded ${buyer.email} wallet with ${amount / 100} GHS`);
    }
  }

  // Create escrows with different statuses
  console.log('\n📦 Creating escrows with various statuses...');

  // 1. AWAITING_FUNDING escrow
  const escrow1 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[0].id,
      sellerId: sellers[0].id,
      amountCents: 50000, // 500 GHS
      currency: 'GHS',
      description: 'Laptop Purchase - Awaiting Payment',
      status: EscrowStatus.AWAITING_FUNDING,
      feeCents: 2500, // 25 GHS (5%)
      netAmountCents: 47500,
    },
  });
  console.log(`  ✅ Created escrow: ${escrow1.description} (AWAITING_FUNDING)`);

  // 2. FUNDED escrow
  const escrow2 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[1].id,
      sellerId: sellers[1].id,
      amountCents: 100000, // 1000 GHS
      currency: 'GHS',
      description: 'Smartphone Sale - Payment Received',
      status: EscrowStatus.FUNDED,
      feeCents: 5000,
      netAmountCents: 95000,
      fundedAt: new Date(),
    },
  });
  // Update buyer wallet (deduct funds)
  const buyer2Wallet = await prisma.wallet.findUnique({ where: { userId: buyers[1].id } });
  if (buyer2Wallet) {
    await prisma.wallet.update({
      where: { id: buyer2Wallet.id },
      data: {
        availableCents: buyer2Wallet.availableCents - 100000,
        pendingCents: buyer2Wallet.pendingCents + 100000,
      },
    });
  }
  console.log(`  ✅ Created escrow: ${escrow2.description} (FUNDED)`);

  // 3. SHIPPED escrow
  const escrow3 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[2].id,
      sellerId: sellers[2].id,
      amountCents: 75000, // 750 GHS
      currency: 'GHS',
      description: 'Electronics Bundle - Shipped',
      status: EscrowStatus.SHIPPED,
      feeCents: 3750,
      netAmountCents: 71250,
      fundedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });
  const buyer3Wallet = await prisma.wallet.findUnique({ where: { userId: buyers[2].id } });
  if (buyer3Wallet) {
    await prisma.wallet.update({
      where: { id: buyer3Wallet.id },
      data: { pendingCents: buyer3Wallet.pendingCents + 75000 },
    });
  }
  console.log(`  ✅ Created escrow: ${escrow3.description} (SHIPPED)`);

  // 4. DELIVERED escrow
  const escrow4 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[3].id,
      sellerId: sellers[3].id,
      amountCents: 150000, // 1500 GHS
      currency: 'GHS',
      description: 'Furniture Set - Delivered',
      status: EscrowStatus.DELIVERED,
      feeCents: 7500,
      netAmountCents: 142500,
      fundedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  const buyer4Wallet = await prisma.wallet.findUnique({ where: { userId: buyers[3].id } });
  if (buyer4Wallet) {
    await prisma.wallet.update({
      where: { id: buyer4Wallet.id },
      data: { pendingCents: buyer4Wallet.pendingCents + 150000 },
    });
  }
  console.log(`  ✅ Created escrow: ${escrow4.description} (DELIVERED)`);

  // 5. RELEASED escrow (completed)
  const escrow5 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[0].id,
      sellerId: sellers[1].id,
      amountCents: 80000, // 800 GHS
      currency: 'GHS',
      description: 'Camera Equipment - Completed',
      status: EscrowStatus.RELEASED,
      feeCents: 4000,
      netAmountCents: 76000,
      fundedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      releasedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });
  const seller1Wallet = await prisma.wallet.findUnique({ where: { userId: sellers[1].id } });
  if (seller1Wallet) {
    await prisma.wallet.update({
      where: { id: seller1Wallet.id },
      data: { availableCents: seller1Wallet.availableCents + 76000 },
    });
  }
  console.log(`  ✅ Created escrow: ${escrow5.description} (RELEASED)`);

  // 6. DISPUTED escrow
  const escrow6 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[4].id,
      sellerId: sellers[4].id,
      amountCents: 120000, // 1200 GHS
      currency: 'GHS',
      description: 'Gaming Console - Under Dispute',
      status: EscrowStatus.DISPUTED,
      feeCents: 6000,
      netAmountCents: 114000,
      fundedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });
  const buyer5Wallet = await prisma.wallet.findUnique({ where: { userId: buyers[4].id } });
  if (buyer5Wallet) {
    await prisma.wallet.update({
      where: { id: buyer5Wallet.id },
      data: { pendingCents: buyer5Wallet.pendingCents + 120000 },
    });
  }
  // Create dispute
  await prisma.dispute.create({
    data: {
      escrowId: escrow6.id,
      initiatorId: buyers[4].id,
      reason: 'NOT_AS_DESCRIBED',
      description: 'Item received does not match description',
      status: 'OPEN',
    },
  });
  console.log(`  ✅ Created escrow: ${escrow6.description} (DISPUTED)`);

  // 7. CANCELLED escrow
  const escrow7 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[2].id,
      sellerId: sellers[3].id,
      amountCents: 60000, // 600 GHS
      currency: 'GHS',
      description: 'Cancelled Order',
      status: EscrowStatus.CANCELLED,
      feeCents: 0,
      netAmountCents: 0,
      cancelledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✅ Created escrow: ${escrow7.description} (CANCELLED)`);

  // Create some milestone escrows
  console.log('\n🎯 Creating milestone escrows...');
  const milestoneEscrow = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[1].id,
      sellerId: sellers[2].id,
      amountCents: 200000, // 2000 GHS
      currency: 'GHS',
      description: 'Website Development Project',
      status: EscrowStatus.FUNDED,
      feeCents: 10000,
      netAmountCents: 190000,
      fundedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      milestones: {
        create: [
          {
            name: 'Design Phase',
            description: 'Complete UI/UX design',
            amountCents: 50000,
            status: 'completed',
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            name: 'Development Phase',
            description: 'Build core features',
            amountCents: 100000,
            status: 'pending',
          },
          {
            name: 'Testing & Launch',
            description: 'Final testing and deployment',
            amountCents: 50000,
            status: 'pending',
          },
        ],
      },
    },
  });
  console.log(`  ✅ Created milestone escrow: ${milestoneEscrow.description}`);

  // Create some escrow messages
  console.log('\n💬 Creating escrow messages...');
  await prisma.escrowMessage.createMany({
    data: [
      {
        escrowId: escrow2.id,
        userId: buyers[1].id,
        content: 'When will you ship the item?',
      },
      {
        escrowId: escrow2.id,
        userId: sellers[1].id,
        content: 'I will ship it tomorrow morning.',
      },
      {
        escrowId: escrow3.id,
        userId: buyers[2].id,
        content: 'Received the tracking number, thanks!',
      },
    ],
  });
  console.log('  ✅ Created 3 escrow messages');

  // Create some evidence
  console.log('\n📎 Creating evidence records...');
  await prisma.evidence.createMany({
    data: [
      {
        escrowId: escrow2.id,
        uploadedBy: sellers[1].id,
        fileName: 'shipping_receipt.pdf',
        fileKey: 'evidence/shipping_receipt.pdf',
        fileSize: 102400,
        type: 'document',
        mimeType: 'application/pdf',
      },
      {
        escrowId: escrow4.id,
        uploadedBy: buyers[3].id,
        fileName: 'delivery_photo.jpg',
        fileKey: 'evidence/delivery_photo.jpg',
        fileSize: 204800,
        type: 'photo',
        mimeType: 'image/jpeg',
      },
    ],
  });
  console.log('  ✅ Created 2 evidence records');

  // Create withdrawal requests
  console.log('\n💸 Creating withdrawal requests...');
  const seller2Wallet = await prisma.wallet.findUnique({ where: { userId: sellers[1].id } });
  if (seller2Wallet && seller2Wallet.availableCents > 0) {
    await prisma.withdrawal.create({
      data: {
        walletId: seller2Wallet.id,
        amountCents: 50000, // 500 GHS
        methodType: WithdrawalMethod.BANK_ACCOUNT,
        methodDetails: {
          accountNumber: '1234567890',
          accountName: 'Jane Seller',
          bankName: 'Ghana Commercial Bank',
        },
        status: WithdrawalStatus.REQUESTED,
        requestedBy: sellers[1].id,
      },
    });
    console.log('  ✅ Created withdrawal request');
  }

  console.log('\n✅ Seed script completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • Users created: ${createdUsers.length}`);
  console.log(`   • Escrows created: 8`);
  console.log(`   • Milestone escrows: 1`);
  console.log(`   • Messages created: 3`);
  console.log(`   • Evidence records: 2`);
  console.log(`   • Withdrawal requests: 1`);
  console.log('\n🔑 All users have password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error running seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

