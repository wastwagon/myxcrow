-- Auto-release when transaction status is complete (DELIVERED or AWAITING_RELEASE) and no dispute.
-- Default 0 = immediate release; N = release N days after deliveredAt.
ALTER TABLE "EscrowAgreement" ALTER COLUMN "autoReleaseDays" SET DEFAULT 0;
