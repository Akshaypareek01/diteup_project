-- Channel order id actually sent to Shiprocket (base DU-… or DU-…-Rn retry).
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiprocketChannelOrderId" TEXT;
