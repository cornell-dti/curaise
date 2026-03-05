-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_reminder_sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pending_users" ALTER COLUMN "id" DROP DEFAULT;
