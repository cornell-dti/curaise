/*
  Warnings:

  - You are about to drop the column `venmo_forwarding_verified` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `venmo_username` on the `organizations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "organizations_venmo_username_key";

-- AlterTable
ALTER TABLE "fundraisers" ADD COLUMN     "venmo_username" TEXT;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "venmo_forwarding_verified",
DROP COLUMN "venmo_username";
