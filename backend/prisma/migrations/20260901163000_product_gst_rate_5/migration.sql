-- Food GST slab for DiteUp SKUs. Invoice tax is computed from Product.gstRate.
ALTER TABLE "Product" ALTER COLUMN "gstRate" SET DEFAULT 5;
UPDATE "Product" SET "gstRate" = 5;
