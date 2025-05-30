-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "modifiedAt" TIMESTAMP(3),
ADD COLUMN     "modifiedBy" TEXT;
