-- AlterTable
ALTER TABLE "orders" ADD COLUMN "paid_amount" MONEY,
ADD COLUMN "payment_mismatch_at" TIMESTAMP(3);
