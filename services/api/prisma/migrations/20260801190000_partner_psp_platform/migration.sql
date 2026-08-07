-- Partner / PSP platform layer for DwumaPOS and future commerce platforms

CREATE TYPE "PlatformEnvironment" AS ENUM ('SANDBOX', 'LIVE');
CREATE TYPE "PartnerReleasePolicy" AS ENUM ('PLATFORM_RELEASE', 'BUYER_CONFIRM', 'DUAL_CONTROL', 'AUTO_ON_DELIVERY', 'MILESTONE_APPROVAL');
CREATE TYPE "CheckoutSessionStatus" AS ENUM ('OPEN', 'COMPLETED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "PlatformAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultEnvironment" "PlatformEnvironment" NOT NULL DEFAULT 'LIVE',
    "releasePolicy" "PartnerReleasePolicy" NOT NULL DEFAULT 'PLATFORM_RELEASE',
    "feePercentageOverride" DOUBLE PRECISION,
    "successUrlAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cancelUrlAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformAccount_slug_key" ON "PlatformAccount"("slug");
CREATE INDEX "PlatformAccount_slug_idx" ON "PlatformAccount"("slug");
CREATE INDEX "PlatformAccount_isActive_idx" ON "PlatformAccount"("isActive");

CREATE TABLE "PlatformApiKey" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "environment" "PlatformEnvironment" NOT NULL,
    "name" TEXT,
    "keyId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "keyType" TEXT NOT NULL DEFAULT 'secret',
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformApiKey_keyId_key" ON "PlatformApiKey"("keyId");
CREATE INDEX "PlatformApiKey_platformId_idx" ON "PlatformApiKey"("platformId");
CREATE INDEX "PlatformApiKey_environment_idx" ON "PlatformApiKey"("environment");
CREATE INDEX "PlatformApiKey_revokedAt_idx" ON "PlatformApiKey"("revokedAt");

CREATE TABLE "PlatformMerchantLink" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "externalMerchantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformMerchantLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformMerchantLink_platformId_externalMerchantId_key" ON "PlatformMerchantLink"("platformId", "externalMerchantId");
CREATE INDEX "PlatformMerchantLink_userId_idx" ON "PlatformMerchantLink"("userId");
CREATE INDEX "PlatformMerchantLink_platformId_idx" ON "PlatformMerchantLink"("platformId");

CREATE TABLE "PartnerCheckoutSession" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "environment" "PlatformEnvironment" NOT NULL,
    "escrowId" TEXT,
    "externalOrderId" TEXT NOT NULL,
    "status" "CheckoutSessionStatus" NOT NULL DEFAULT 'OPEN',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "successUrl" TEXT NOT NULL,
    "cancelUrl" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "buyerPhone" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerCheckoutSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnerCheckoutSession_platformId_environment_externalOrderId_key" ON "PartnerCheckoutSession"("platformId", "environment", "externalOrderId");
CREATE INDEX "PartnerCheckoutSession_escrowId_idx" ON "PartnerCheckoutSession"("escrowId");
CREATE INDEX "PartnerCheckoutSession_status_idx" ON "PartnerCheckoutSession"("status");
CREATE INDEX "PartnerCheckoutSession_expiresAt_idx" ON "PartnerCheckoutSession"("expiresAt");

CREATE TABLE "PlatformWebhookEndpoint" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "environment" "PlatformEnvironment" NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformWebhookEndpoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformWebhookEndpoint_platformId_environment_idx" ON "PlatformWebhookEndpoint"("platformId", "environment");
CREATE INDEX "PlatformWebhookEndpoint_isActive_idx" ON "PlatformWebhookEndpoint"("isActive");

CREATE TABLE "PlatformWebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastStatusCode" INTEGER,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformWebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformWebhookDelivery_eventId_key" ON "PlatformWebhookDelivery"("eventId");
CREATE INDEX "PlatformWebhookDelivery_endpointId_idx" ON "PlatformWebhookDelivery"("endpointId");
CREATE INDEX "PlatformWebhookDelivery_status_idx" ON "PlatformWebhookDelivery"("status");
CREATE INDEX "PlatformWebhookDelivery_nextRetryAt_idx" ON "PlatformWebhookDelivery"("nextRetryAt");
CREATE INDEX "PlatformWebhookDelivery_eventType_idx" ON "PlatformWebhookDelivery"("eventType");

CREATE TABLE "PartnerIdempotencyRecord" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerIdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnerIdempotencyRecord_platformId_key_key" ON "PartnerIdempotencyRecord"("platformId", "key");
CREATE INDEX "PartnerIdempotencyRecord_createdAt_idx" ON "PartnerIdempotencyRecord"("createdAt");

ALTER TABLE "EscrowAgreement" ADD COLUMN "platformId" TEXT;
ALTER TABLE "EscrowAgreement" ADD COLUMN "environment" "PlatformEnvironment";
ALTER TABLE "EscrowAgreement" ADD COLUMN "externalOrderId" TEXT;
ALTER TABLE "EscrowAgreement" ADD COLUMN "releasePolicy" "PartnerReleasePolicy";
ALTER TABLE "EscrowAgreement" ADD COLUMN "partnerMetadata" JSONB;

CREATE UNIQUE INDEX "EscrowAgreement_platformId_environment_externalOrderId_key" ON "EscrowAgreement"("platformId", "environment", "externalOrderId");
CREATE INDEX "EscrowAgreement_platformId_idx" ON "EscrowAgreement"("platformId");
CREATE INDEX "EscrowAgreement_externalOrderId_idx" ON "EscrowAgreement"("externalOrderId");

ALTER TABLE "PlatformApiKey" ADD CONSTRAINT "PlatformApiKey_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformMerchantLink" ADD CONSTRAINT "PlatformMerchantLink_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformMerchantLink" ADD CONSTRAINT "PlatformMerchantLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerCheckoutSession" ADD CONSTRAINT "PartnerCheckoutSession_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerCheckoutSession" ADD CONSTRAINT "PartnerCheckoutSession_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "EscrowAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlatformWebhookEndpoint" ADD CONSTRAINT "PlatformWebhookEndpoint_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformWebhookDelivery" ADD CONSTRAINT "PlatformWebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "PlatformWebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerIdempotencyRecord" ADD CONSTRAINT "PartnerIdempotencyRecord_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscrowAgreement" ADD CONSTRAINT "EscrowAgreement_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "PlatformAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
