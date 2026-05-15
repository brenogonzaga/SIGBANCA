-- CreateEnum
CREATE TYPE "TipoProtocolo" AS ENUM ('FICHA_CATALOGRAFICA', 'NADA_CONSTA', 'ENTREGA_VERSAO_FINAL');

-- CreateEnum
CREATE TYPE "ProtocoloStatus" AS ENUM ('ABERTO', 'EM_PROCESSAMENTO', 'DEFERIDO', 'INDEFERIDO', 'CANCELADO');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'BIBLIOTECARIO';

-- DropIndex
DROP INDEX "public"."usuarios_email_idx";

-- DropIndex
DROP INDEX "public"."usuarios_matricula_idx";

-- DropIndex
DROP INDEX "public"."usuarios_role_idx";

-- AlterTable
ALTER TABLE "bancas" ADD COLUMN     "folhaAprovacaoUrl" TEXT;

-- CreateTable
CREATE TABLE "protocolos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoProtocolo" NOT NULL,
    "status" "ProtocoloStatus" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "alunoId" TEXT NOT NULL,
    "trabalhoId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "arquivoEnviadoUrl" TEXT,
    "arquivoRetornoUrl" TEXT,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocolos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protocolos_alunoId_idx" ON "protocolos"("alunoId");

-- CreateIndex
CREATE INDEX "protocolos_trabalhoId_idx" ON "protocolos"("trabalhoId");

-- CreateIndex
CREATE INDEX "protocolos_status_idx" ON "protocolos"("status");

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
