import { PrismaClient, EscrowStatus, UserRole, KYCStatus, WithdrawalMethod, WithdrawalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as MinIO from 'minio';

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

function buildMinioClientFromEnv() {
  const endpoint = process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT || 'minio';
  const accessKey = process.env.S3_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || 'minioadmin';
  const secretKey = process.env.S3_SECRET_KEY || process.env.MINIO_SECRET_KEY || 'minioadmin';

  let endPoint = endpoint;
  let port = 9000;

  try {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint);
      endPoint = url.hostname;
      port = parseInt(url.port || '9000', 10);
    } else {
      endPoint = endpoint.replace(/^http:\/\//, '').replace(/^https:\/\//, '').split(':')[0];
      const portMatch = endpoint.match(/:(\d+)/);
      if (portMatch) port = parseInt(portMatch[1], 10);
    }
  } catch {
    // Keep defaults
  }

  return new MinIO.Client({
    endPoint,
    port,
    useSSL: false,
    accessKey,
    secretKey,
  });
}

async function ensureBucket(client: MinIO.Client, bucket: string) {
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket, 'us-east-1');
  }
}

async function putObject(
  client: MinIO.Client,
  bucket: string,
  objectName: string,
  data: Buffer,
  meta: Record<string, string>,
) {
  // Use promise-based API (newer MinIO client)
  await client.putObject(bucket, objectName, data, data.length, meta);
}

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
  const buyers = createdUsers.filter((u) => u.roles.includes(UserRole.BUYER));
  const sellers = createdUsers.filter((u) => u.roles.includes(UserRole.SELLER));

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

  // Create milestone escrows
  console.log('\n🎯 Creating milestone escrows...');
  
  // Milestone Escrow 1 - Website Development (In Progress)
  const milestoneEscrow1 = await prisma.escrowAgreement.create({
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
  console.log(`  ✅ Created milestone escrow: ${milestoneEscrow1.description}`);
  
  // Milestone Escrow 2 - Mobile App (Awaiting Funding)
  const milestoneEscrow2 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[3].id,
      sellerId: sellers[0].id,
      amountCents: 300000, // 3000 GHS
      currency: 'GHS',
      description: 'Mobile App Development - iOS & Android',
      status: EscrowStatus.AWAITING_FUNDING,
      feeCents: 15000,
      netAmountCents: 285000,
      milestones: {
        create: [
          {
            name: 'Project Setup & Backend',
            description: 'Initialize project, setup database and API',
            amountCents: 80000,
            status: 'pending',
          },
          {
            name: 'UI Implementation',
            description: 'Build all screens and navigation',
            amountCents: 120000,
            status: 'pending',
          },
          {
            name: 'Testing & Deployment',
            description: 'Test app and deploy to stores',
            amountCents: 100000,
            status: 'pending',
          },
        ],
      },
    },
  });
  console.log(`  ✅ Created milestone escrow: ${milestoneEscrow2.description}`);
  
  // Milestone Escrow 3 - Graphic Design (Partially Completed)
  const milestoneEscrow3 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[0].id,
      sellerId: sellers[3].id,
      amountCents: 90000, // 900 GHS
      currency: 'GHS',
      description: 'Brand Identity Design Package',
      status: EscrowStatus.FUNDED,
      feeCents: 4500,
      netAmountCents: 85500,
      fundedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      milestones: {
        create: [
          {
            name: 'Logo Design',
            description: 'Create 3 logo concepts',
            amountCents: 30000,
            status: 'completed',
            completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            name: 'Brand Guidelines',
            description: 'Color palette, typography, usage rules',
            amountCents: 30000,
            status: 'completed',
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            name: 'Marketing Materials',
            description: 'Business cards, letterhead, social media templates',
            amountCents: 30000,
            status: 'pending',
          },
        ],
      },
    },
  });
  console.log(`  ✅ Created milestone escrow: ${milestoneEscrow3.description}`);

  // Create more disputes with different statuses
  console.log('\n⚖️ Creating additional disputes...');
  
  // Dispute 2 - In Mediation
  const escrow8 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[2].id,
      sellerId: sellers[0].id,
      amountCents: 95000, // 950 GHS
      currency: 'GHS',
      description: 'Designer Handbag - Quality Issue',
      status: EscrowStatus.DISPUTED,
      feeCents: 4750,
      netAmountCents: 90250,
      fundedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });
  const dispute2 = await prisma.dispute.create({
    data: {
      escrowId: escrow8.id,
      initiatorId: buyers[2].id,
      reason: 'DEFECTIVE',
      description: 'Item has manufacturing defect - stitching is coming apart',
      status: 'MEDIATION',
    },
  });
  console.log(`  ✅ Created dispute: ${escrow8.description} (MEDIATION)`);
  
  // Dispute 3 - Resolved
  const escrow9 = await prisma.escrowAgreement.create({
    data: {
      buyerId: buyers[3].id,
      sellerId: sellers[2].id,
      amountCents: 65000, // 650 GHS
      currency: 'GHS',
      description: 'Bluetooth Speaker - Wrong Model Sent',
      status: EscrowStatus.REFUNDED,
      feeCents: 3250,
      netAmountCents: 61750,
      fundedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      refundedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.dispute.create({
    data: {
      escrowId: escrow9.id,
      initiatorId: buyers[3].id,
      reason: 'WRONG_ITEM',
      description: 'Ordered Model X but received Model Y',
      status: 'RESOLVED',
      resolution: 'Full refund issued to buyer',
    },
  });
  console.log(`  ✅ Created dispute: ${escrow9.description} (RESOLVED - REFUNDED)`);
  
  // Create escrow messages
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
      {
        escrowId: milestoneEscrow1.id,
        userId: buyers[1].id,
        content: 'The design looks great! Ready to move to development phase.',
      },
      {
        escrowId: milestoneEscrow1.id,
        userId: sellers[2].id,
        content: 'Thank you! I will start on the backend setup this week.',
      },
      {
        escrowId: escrow4.id,
        userId: buyers[3].id,
        content: 'Everything arrived in perfect condition!',
      },
      {
        escrowId: escrow4.id,
        userId: sellers[3].id,
        content: 'Glad to hear that! Please confirm delivery when ready.',
      },
    ],
  });
  console.log('  ✅ Created 7 escrow messages');

  // Create evidence records
  console.log('\n📎 Creating evidence records...');
  try {
    const bucket = process.env.S3_BUCKET || process.env.MINIO_BUCKET || 'evidence';
    const client = buildMinioClientFromEnv();
    await ensureBucket(client, bucket);

    const seedItems = [
      {
        escrowId: escrow2.id,
        uploadedBy: sellers[1].id,
        fileName: 'shipping_receipt.txt',
        mimeType: 'text/plain',
        type: 'document',
        description: 'Shipping receipt from courier',
        body: Buffer.from(
          `SHIPPING RECEIPT\n\nEscrow ID: ${escrow2.id}\nTracking: GH123456789\nCourier: Ghana Post\nDate: ${new Date().toISOString()}\n`,
          'utf-8',
        ),
      },
      {
        escrowId: escrow3.id,
        uploadedBy: sellers[2].id,
        fileName: 'package_photo.txt',
        mimeType: 'text/plain',
        type: 'photo',
        description: 'Package ready for shipment',
        body: Buffer.from(`[Photo placeholder] Package sealed and labeled for escrow ${escrow3.id}\n`, 'utf-8'),
      },
      {
        escrowId: escrow4.id,
        uploadedBy: buyers[3].id,
        fileName: 'delivery_photo.txt',
        mimeType: 'text/plain',
        type: 'photo',
        description: 'Item delivered - furniture set',
        body: Buffer.from(`[Photo placeholder] Delivery confirmation for escrow ${escrow4.id}\n`, 'utf-8'),
      },
      {
        escrowId: escrow6.id,
        uploadedBy: buyers[4].id,
        fileName: 'item_defect_photo.txt',
        mimeType: 'text/plain',
        type: 'photo',
        description: 'Photo showing product defect',
        body: Buffer.from(`[Photo placeholder] Gaming console defect evidence for dispute\n`, 'utf-8'),
      },
      {
        escrowId: escrow8.id,
        uploadedBy: buyers[2].id,
        fileName: 'handbag_stitching_issue.txt',
        mimeType: 'text/plain',
        type: 'photo',
        description: 'Close-up of stitching defect',
        body: Buffer.from(`[Photo placeholder] Handbag stitching coming apart - manufacturing defect\n`, 'utf-8'),
      },
      {
        escrowId: escrow8.id,
        uploadedBy: sellers[0].id,
        fileName: 'quality_control_certificate.txt',
        mimeType: 'text/plain',
        type: 'document',
        description: 'Product quality control certificate',
        body: Buffer.from(`QUALITY CONTROL CERTIFICATE\n\nProduct passed inspection on [date]\nInspector: [name]\n`, 'utf-8'),
      },
      {
        escrowId: milestoneEscrow1.id,
        uploadedBy: sellers[2].id,
        fileName: 'design_mockups.txt',
        mimeType: 'text/plain',
        type: 'document',
        description: 'UI/UX design mockups (Milestone 1)',
        body: Buffer.from(
          `[Mockup files placeholder]\n\nDesign Phase Deliverables:\n- Homepage design\n- Dashboard layouts\n- Mobile responsive views\n`,
          'utf-8',
        ),
      },
      {
        escrowId: milestoneEscrow3.id,
        uploadedBy: sellers[3].id,
        fileName: 'logo_concepts.txt',
        mimeType: 'text/plain',
        type: 'document',
        description: 'Logo design concepts (3 variations)',
        body: Buffer.from(`[Design files placeholder]\n\nLogo Concepts:\n- Concept A: Modern\n- Concept B: Classic\n- Concept C: Minimal\n`, 'utf-8'),
      },
      {
        escrowId: milestoneEscrow3.id,
        uploadedBy: sellers[3].id,
        fileName: 'brand_guidelines.txt',
        mimeType: 'text/plain',
        type: 'document',
        description: 'Brand guidelines document',
        body: Buffer.from(
          `BRAND GUIDELINES\n\nColor Palette:\n- Primary: #3B82F6\n- Secondary: #10B981\n\nTypography:\n- Headings: Inter Bold\n- Body: Inter Regular\n`,
          'utf-8',
        ),
      },
    ];

    for (const item of seedItems) {
      const objectName = `escrow/${item.escrowId}/seed_${Date.now()}_${Math.random().toString(36).substring(7)}_${item.fileName}`;
      await putObject(client, bucket, objectName, item.body, { 'Content-Type': item.mimeType });

      await prisma.evidence.create({
        data: {
          escrowId: item.escrowId,
          disputeId: (item as any).disputeId || null,
          uploadedBy: item.uploadedBy,
          fileName: item.fileName,
          fileKey: objectName,
          fileSize: item.body.length,
          type: item.type,
          mimeType: item.mimeType,
          description: item.description,
        },
      });
    }

    console.log('  ✅ Created 9 evidence records (with real objects in storage)');
  } catch (e: any) {
    console.warn(`  ⚠️ Skipped evidence seeding (storage not reachable): ${e?.message || e}`);
  }

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
  console.log(`   • Regular escrows: 9 (various statuses)`);
  console.log(`   • Milestone escrows: 3 (Website, Mobile App, Brand Design)`);
  console.log(`   • Total escrows: 12`);
  console.log(`   • Disputes created: 3 (OPEN, MEDIATION, RESOLVED)`);
  console.log(`   • Messages created: 7`);
  console.log(`   • Evidence records: 9 (escrows + disputes)`);
  console.log(`   • Withdrawal requests: 1`);
  console.log('\n🔑 All users have password: password123');
  console.log('\n📝 Test Scenarios Available:');
  console.log('   • Escrow lifecycle: Create → Fund → Ship → Deliver → Release');
  console.log('   • Milestone payments: 3 escrows with multi-phase projects');
  console.log('   • Disputes: Active disputes in different stages');
  console.log('   • Evidence: Photos, receipts, quality certificates');
  console.log('   • Messaging: Buyer-seller communication examples');
}

main()
  .catch((e) => {
    console.error('❌ Error running seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  ``