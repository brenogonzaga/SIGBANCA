/*
  Warnings:

  - You are about to drop the `assinaturas_eletronicas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `autorizacoes_publicacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoTrabalho" AS ENUM ('TCC1', 'TCC2');

-- DropForeignKey
ALTER TABLE "public"."assinaturas_eletronicas" DROP CONSTRAINT "assinaturas_eletronicas_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."autorizacoes_publicacao" DROP CONSTRAINT "autorizacoes_publicacao_trabalhoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."protocolos" DROP CONSTRAINT "protocolos_trabalhoId_fkey";

-- AlterTable
ALTER TABLE "trabalhos" ADD COLUMN     "tipo" "TipoTrabalho" NOT NULL DEFAULT 'TCC2';

-- DropTable
DROP TABLE "public"."assinaturas_eletronicas";

-- DropTable
DROP TABLE "public"."autorizacoes_publicacao";

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
