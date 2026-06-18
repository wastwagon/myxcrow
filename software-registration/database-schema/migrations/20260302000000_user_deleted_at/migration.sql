-- Add deletedAt to User for account deletion (App Store / data subject request)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
