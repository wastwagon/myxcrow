-- Split fee fields + encrypted delivery PIN for participant re-display
ALTER TABLE "EscrowAgreement" ADD COLUMN "buyerFeeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EscrowAgreement" ADD COLUMN "sellerFeeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EscrowAgreement" ADD COLUMN "fundingAmountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EscrowAgreement" ADD COLUMN "deliveryPinEncrypted" TEXT;

-- Backfill legacy escrows (seller-paid fee model)
UPDATE "EscrowAgreement"
SET
  "fundingAmountCents" = "amountCents",
  "sellerFeeCents" = "feeCents",
  "buyerFeeCents" = 0
WHERE "fundingAmountCents" = 0;
