CREATE TABLE IF NOT EXISTS "PhoneVerificationCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PhoneVerificationCode_phone_idx" ON "PhoneVerificationCode"("phone");
CREATE INDEX IF NOT EXISTS "PhoneVerificationCode_expiresAt_idx" ON "PhoneVerificationCode"("expiresAt");
