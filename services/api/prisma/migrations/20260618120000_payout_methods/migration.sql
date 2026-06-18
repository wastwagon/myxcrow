-- Saved payout methods for withdrawals (bank / mobile money)

CREATE TABLE "PayoutMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "methodType" "WithdrawalMethod" NOT NULL,
    "label" TEXT,
    "details" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutMethod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PayoutMethod_userId_idx" ON "PayoutMethod"("userId");
CREATE INDEX "PayoutMethod_userId_isDefault_idx" ON "PayoutMethod"("userId", "isDefault");

ALTER TABLE "PayoutMethod" ADD CONSTRAINT "PayoutMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
