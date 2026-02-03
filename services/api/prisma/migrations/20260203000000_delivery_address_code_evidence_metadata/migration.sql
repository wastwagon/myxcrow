-- AlterTable EscrowAgreement: add delivery address fields
ALTER TABLE "EscrowAgreement" ADD COLUMN "deliveryRegion" TEXT;
ALTER TABLE "EscrowAgreement" ADD COLUMN "deliveryCity" TEXT;
ALTER TABLE "EscrowAgreement" ADD COLUMN "deliveryAddressLine" TEXT;
ALTER TABLE "EscrowAgreement" ADD COLUMN "deliveryPhone" TEXT;

-- AlterTable Shipment: add delivery verification code and short reference
ALTER TABLE "Shipment" ADD COLUMN "deliveryCode" TEXT;
ALTER TABLE "Shipment" ADD COLUMN "shortReference" TEXT;
CREATE UNIQUE INDEX "Shipment_deliveryCode_key" ON "Shipment"("deliveryCode");
CREATE UNIQUE INDEX "Shipment_shortReference_key" ON "Shipment"("shortReference");

-- AlterTable Evidence: add metadata for geo-tagging
ALTER TABLE "Evidence" ADD COLUMN "metadata" JSONB;
