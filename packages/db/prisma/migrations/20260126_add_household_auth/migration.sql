-- Add auth fields to Household
ALTER TABLE "Household" ADD COLUMN "code" TEXT;
ALTER TABLE "Household" ADD COLUMN "pinHash" TEXT;

UPDATE "Household"
SET "code" = COALESCE("accessCode", 'family'),
    "pinHash" = COALESCE("pinHash", '$2b$10$uRoiPt.w7gMizHDC16PN6u4C92q.85UCMq6UPSUei.wOZkC5GRW96')
WHERE "code" IS NULL OR "pinHash" IS NULL;

WITH ranked AS (
    SELECT id,
           code,
           ROW_NUMBER() OVER (PARTITION BY code ORDER BY "createdAt", id) AS rn
    FROM "Household"
)
UPDATE "Household" h
SET code = h.code || '-' || SUBSTRING(h.id, 1, 6)
FROM ranked r
WHERE h.id = r.id AND r.rn > 1;

ALTER TABLE "Household" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Household" ALTER COLUMN "pinHash" SET NOT NULL;

CREATE UNIQUE INDEX "Household_code_key" ON "Household"("code");

ALTER TABLE "Household" DROP COLUMN "accessCode";

-- CreateTable
CREATE TABLE "HouseholdSession" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "HouseholdSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdSession_tokenHash_key" ON "HouseholdSession"("tokenHash");

-- CreateIndex
CREATE INDEX "HouseholdSession_householdId_idx" ON "HouseholdSession"("householdId");

-- CreateIndex
CREATE INDEX "HouseholdSession_expiresAt_idx" ON "HouseholdSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "HouseholdSession" ADD CONSTRAINT "HouseholdSession_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
