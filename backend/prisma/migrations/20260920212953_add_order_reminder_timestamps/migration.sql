-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_reminded_at" TIMESTAMP(3),
ADD COLUMN     "pickup_reminded_at" TIMESTAMP(3);

-- Backfill: treat existing pending Venmo orders as already reminded, so the
-- first reminder run doesn't email every unpaid order ever placed.
UPDATE "orders"
SET "payment_reminded_at" = NOW()
WHERE "payment_status" = 'PENDING'
  AND "payment_method" = 'VENMO'
  AND "payment_reminded_at" IS NULL;
