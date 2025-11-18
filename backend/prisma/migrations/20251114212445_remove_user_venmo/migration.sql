/*
  Warnings:

  - You are about to drop the column `venmo_username` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_venmo_username_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "venmo_username";
