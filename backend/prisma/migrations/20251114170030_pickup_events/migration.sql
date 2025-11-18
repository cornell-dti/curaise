/*
  Warnings:

  - You are about to drop the column `pickup_ends_at` on the `fundraisers` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_location` on the `fundraisers` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_starts_at` on the `fundraisers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_fundraiser_id_fkey";

-- AlterTable
ALTER TABLE "fundraisers" DROP COLUMN "pickup_ends_at",
DROP COLUMN "pickup_location",
DROP COLUMN "pickup_starts_at";

-- CreateTable
CREATE TABLE "pickup_events" (
    "id" UUID NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundraiser_id" UUID NOT NULL,

    CONSTRAINT "pickup_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pickup_events" ADD CONSTRAINT "pickup_events_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "fundraisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "fundraisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
