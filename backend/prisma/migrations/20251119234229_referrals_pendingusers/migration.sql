-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "referral_id" UUID;

-- CreateTable
CREATE TABLE "pending_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundraiser_id" UUID NOT NULL,
    "referrer_id" UUID NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrganizationToPendingUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_OrganizationToPendingUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_users_email_key" ON "pending_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_fundraiser_id_referrer_id_key" ON "referrals"("fundraiser_id", "referrer_id");

-- CreateIndex
CREATE INDEX "_OrganizationToPendingUser_B_index" ON "_OrganizationToPendingUser"("B");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "fundraisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToPendingUser" ADD CONSTRAINT "_OrganizationToPendingUser_A_fkey" FOREIGN KEY ("A") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToPendingUser" ADD CONSTRAINT "_OrganizationToPendingUser_B_fkey" FOREIGN KEY ("B") REFERENCES "pending_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
