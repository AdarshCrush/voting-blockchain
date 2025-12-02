/*
  Warnings:

  - Made the column `position` on table `Candidate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "position" SET NOT NULL;

-- AlterTable
ALTER TABLE "Party" ADD COLUMN     "iconUrl" TEXT;
