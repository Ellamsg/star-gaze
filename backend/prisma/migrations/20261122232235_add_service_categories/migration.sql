-- AlterTable
ALTER TABLE "services" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_sortOrder_idx" ON "categories"("sortOrder");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "services"("categoryId");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the categories the studio already uses, then backfill existing services.
INSERT INTO "categories" ("id", "name", "slug", "sortOrder", "active", "createdAt", "updatedAt")
VALUES
    ('cat_nails', 'Nails', 'nails', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_lashes', 'Lashes', 'lashes', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "services" SET "categoryId" = 'cat_lashes' WHERE LOWER("name") LIKE '%lash%';
UPDATE "services" SET "categoryId" = 'cat_nails' WHERE "categoryId" IS NULL;
