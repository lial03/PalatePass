-- AlterTable
ALTER TABLE "Restaurant"
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "countryName" TEXT,
ADD COLUMN "googlePlaceId" TEXT,
ADD COLUMN "submissionNotes" TEXT;

-- AlterTable
ALTER TABLE "Rating"
ADD COLUMN "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "budgetTier" TEXT,
ADD COLUMN "budgetAmount" INTEGER,
ADD COLUMN "budgetCurrency" TEXT;
