-- CreateTable
CREATE TABLE "studio_schedule" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "openTime" VARCHAR(5) NOT NULL,
    "closeTime" VARCHAR(5) NOT NULL,
    "stepMinutes" INTEGER NOT NULL DEFAULT 30,
    "openWeekdays" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "horizonDays" INTEGER NOT NULL DEFAULT 180,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_overrides" (
    "id" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" VARCHAR(5),
    "closeTime" VARCHAR(5),
    "stepMinutes" INTEGER,
    "note" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "note" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "day_overrides_date_key" ON "day_overrides"("date");

-- CreateIndex
CREATE INDEX "schedule_blocks_date_idx" ON "schedule_blocks"("date");

-- Seed the default timetable. The studio is open every day, 09:00–19:00, with
-- a start time every 30 minutes until the admin changes it.
INSERT INTO "studio_schedule" ("id", "openTime", "closeTime", "stepMinutes", "openWeekdays", "horizonDays", "updatedAt")
VALUES ('default', '09:00', '19:00', 30, ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[], 180, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
