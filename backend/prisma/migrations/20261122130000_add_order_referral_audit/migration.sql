-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "referral_updated_at" TIMESTAMP(3),
ADD COLUMN     "referral_updated_by_id" UUID;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_referral_updated_by_id_fkey" FOREIGN KEY ("referral_updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

