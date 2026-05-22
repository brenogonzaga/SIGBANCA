-- DropForeignKey
ALTER TABLE "public"."protocolos" DROP CONSTRAINT "protocolos_trabalhoId_fkey";

-- CreateTable
CREATE TABLE "autorizacoes_publicacao" (
    "id" TEXT NOT NULL,
    "trabalhoId" TEXT NOT NULL,
    "rg" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "confidencial" BOOLEAN NOT NULL DEFAULT false,
    "geraPatente" BOOLEAN NOT NULL DEFAULT false,
    "liberadoReprod" BOOLEAN NOT NULL DEFAULT true,
    "documentoUrl" TEXT,
    "assinaturaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autorizacoes_publicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas_eletronicas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "hashAssinatura" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assinaturas_eletronicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "autorizacoes_publicacao_trabalhoId_key" ON "autorizacoes_publicacao"("trabalhoId");

-- CreateIndex
CREATE INDEX "assinaturas_eletronicas_usuarioId_idx" ON "assinaturas_eletronicas"("usuarioId");

-- CreateIndex
CREATE INDEX "assinaturas_eletronicas_entidadeId_tipoDocumento_idx" ON "assinaturas_eletronicas"("entidadeId", "tipoDocumento");

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autorizacoes_publicacao" ADD CONSTRAINT "autorizacoes_publicacao_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas_eletronicas" ADD CONSTRAINT "assinaturas_eletronicas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
