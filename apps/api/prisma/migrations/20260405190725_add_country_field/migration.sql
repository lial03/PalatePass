-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "country" TEXT,
ADD COLUMN     "placeId" TEXT;
