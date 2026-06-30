-- Migration: switch auth from email to phone

-- Step 1: Add name column to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Step 2: Fill phone with a placeholder for any existing rows that have NULL phone
-- (so we can make it NOT NULL safely)
UPDATE "users" SET "phone" = CONCAT('0300000000', id::text) WHERE "phone" IS NULL;

-- Step 3: Make phone NOT NULL
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;

-- Step 4: Make email nullable (drop the NOT NULL constraint)
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
