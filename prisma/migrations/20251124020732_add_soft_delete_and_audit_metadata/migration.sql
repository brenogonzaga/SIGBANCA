ALTER TABLE "bancas" ADD COLUMN     "deletedAt" TIMESTAMP(3);

ALTER TABLE "trabalhos" ADD COLUMN     "deletedAt" TIMESTAMP(3);

ALTER TABLE "usuarios" ADD COLUMN     "deletedAt" TIMESTAMP(3);
