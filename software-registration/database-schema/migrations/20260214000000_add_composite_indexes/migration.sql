-- Add composite indexes for common query patterns (webhook lookup, escrow listing, dispute filtering)
CREATE INDEX "Payment_providerId_type_idx" ON "Payment"("providerId", "type");
CREATE INDEX "WalletFunding_externalRef_status_idx" ON "WalletFunding"("externalRef", "status");
CREATE INDEX "EscrowAgreement_buyerId_status_idx" ON "EscrowAgreement"("buyerId", "status");
CREATE INDEX "EscrowAgreement_sellerId_status_idx" ON "EscrowAgreement"("sellerId", "status");
CREATE INDEX "Dispute_escrowId_status_idx" ON "Dispute"("escrowId", "status");
