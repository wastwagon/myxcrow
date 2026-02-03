-- CreateEnum
CREATE TYPE "DisputeResolutionOutcome" AS ENUM ('RELEASE_TO_SELLER', 'REFUND_TO_BUYER');

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN "resolutionOutcome" "DisputeResolutionOutcome";
