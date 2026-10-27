-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('DESSERTS', 'FOOD', 'DRINKS', 'APPAREL', 'OTHER');

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "category" "ItemCategory" NOT NULL DEFAULT 'OTHER';

