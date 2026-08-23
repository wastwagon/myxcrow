-- AlterTable
ALTER TABLE "EscrowAgreement" ADD COLUMN IF NOT EXISTS "supportJoinedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EscrowMessage" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "EscrowMessage" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EscrowMessage" ADD COLUMN IF NOT EXISTS "attachmentKey" TEXT;
ALTER TABLE "EscrowMessage" ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;
ALTER TABLE "EscrowMessage" ADD COLUMN IF NOT EXISTS "attachmentMime" TEXT;

CREATE INDEX IF NOT EXISTS "EscrowMessage_escrowId_createdAt_idx" ON "EscrowMessage"("escrowId", "createdAt");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SupportConversationStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "EscrowThreadRead" (
    "escrowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowThreadRead_pkey" PRIMARY KEY ("escrowId","userId")
);

CREATE INDEX IF NOT EXISTS "EscrowThreadRead_userId_idx" ON "EscrowThreadRead"("userId");

CREATE TABLE IF NOT EXISTS "SupportConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportConversation_userId_status_idx" ON "SupportConversation"("userId", "status");
CREATE INDEX IF NOT EXISTS "SupportConversation_status_lastMessageAt_idx" ON "SupportConversation"("status", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "SupportConversation_assignedToId_idx" ON "SupportConversation"("assignedToId");

CREATE TABLE IF NOT EXISTS "SupportMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "content" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "attachmentKey" TEXT,
    "attachmentName" TEXT,
    "attachmentMime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportMessage_senderId_idx" ON "SupportMessage"("senderId");

CREATE TABLE IF NOT EXISTS "SupportThreadRead" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportThreadRead_pkey" PRIMARY KEY ("conversationId","userId")
);

CREATE INDEX IF NOT EXISTS "SupportThreadRead_userId_idx" ON "SupportThreadRead"("userId");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "EscrowMessage" ADD CONSTRAINT "EscrowMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EscrowThreadRead" ADD CONSTRAINT "EscrowThreadRead_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "EscrowAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EscrowThreadRead" ADD CONSTRAINT "EscrowThreadRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportThreadRead" ADD CONSTRAINT "SupportThreadRead_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupportThreadRead" ADD CONSTRAINT "SupportThreadRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
