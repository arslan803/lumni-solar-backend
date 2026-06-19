-- AlterTable: add new columns to installer_profiles
ALTER TABLE "installer_profiles"
  ADD COLUMN IF NOT EXISTS "full_name" TEXT,
  ADD COLUMN IF NOT EXISTS "profile_photo_url" TEXT,
  ADD COLUMN IF NOT EXISTS "cnic_number" TEXT,
  ADD COLUMN IF NOT EXISTS "cnic_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "years_experience" INTEGER,
  ADD COLUMN IF NOT EXISTS "projects_completed" INTEGER,
  ADD COLUMN IF NOT EXISTS "specializations" JSONB,
  ADD COLUMN IF NOT EXISTS "service_areas" JSONB,
  ADD COLUMN IF NOT EXISTS "training_certificate_url" TEXT,
  ADD COLUMN IF NOT EXISTS "phone_private" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp_number" TEXT,
  ADD COLUMN IF NOT EXISTS "company_name" TEXT,
  ADD COLUMN IF NOT EXISTS "full_address" TEXT;

-- CreateTable: installer_gallery
CREATE TABLE IF NOT EXISTS "installer_gallery" (
  "id" TEXT NOT NULL,
  "installer_profile_id" TEXT NOT NULL,
  "photo_url" TEXT NOT NULL,
  "caption" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "installer_gallery_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "installer_gallery"
  ADD CONSTRAINT "installer_gallery_installer_profile_id_fkey"
  FOREIGN KEY ("installer_profile_id")
  REFERENCES "installer_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
