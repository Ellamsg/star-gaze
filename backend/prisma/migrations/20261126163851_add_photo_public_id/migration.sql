/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `appointment_photos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `appointment_photos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "appointment_photos" ADD COLUMN     "publicId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "appointment_photos_publicId_key" ON "appointment_photos"("publicId");
