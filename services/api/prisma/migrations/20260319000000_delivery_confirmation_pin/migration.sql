-- AlterTable
ALTER TABLE "EscrowAgreement" ADD COLUMN "deliveryConfirmationMode" TEXT DEFAULT 'code',
ADD COLUMN "deliveryPinHash" TEXT;
