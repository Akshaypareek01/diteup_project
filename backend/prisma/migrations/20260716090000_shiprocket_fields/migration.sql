-- Shiprocket integration: push state + shipment ids + last webhook status on Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiprocketOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiprocketShipmentId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiprocketPushStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiprocketPushError" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiprocketLastStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiprocketStatusAt" TIMESTAMP(3);
