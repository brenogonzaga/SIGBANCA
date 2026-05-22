-- DropForeignKey
ALTER TABLE "public"."assinaturas_eletronicas" DROP CONSTRAINT "assinaturas_eletronicas_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."autorizacoes_publicacao" DROP CONSTRAINT "autorizacoes_publicacao_trabalhoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."protocolos" DROP CONSTRAINT "protocolos_trabalhoId_fkey";

-- AddForeignKey
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autorizacoes_publicacao" ADD CONSTRAINT "autorizacoes_publicacao_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas_eletronicas" ADD CONSTRAINT "assinaturas_eletronicas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
