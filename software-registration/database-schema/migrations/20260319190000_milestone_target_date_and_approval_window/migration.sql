-- AlterTable
ALTER TABLE "EscrowMilestone"
ADD COLUMN "targetDate" TIMESTAMP(3),
ADD COLUMN "approvalWindowDays" INTEGER NOT NULL DEFAULT 5;
