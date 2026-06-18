-- Escrow category: physical goods vs professional services

ALTER TABLE "EscrowAgreement" ADD COLUMN "escrowCategory" TEXT;
ALTER TABLE "EscrowAgreement" ADD COLUMN "serviceType" TEXT;
