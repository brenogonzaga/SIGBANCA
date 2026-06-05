import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { getDocusignClient, downloadEnvelopeDocuments } from "@/app/lib/docusign";
import { uploadFile } from "@/app/lib/minio";
import docusign from "docusign-esign";

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      const avaliacao = await prisma.avaliacao.findUnique({
        where: { id },
        include: {
          membro: {
            include: {
              usuario: true
            }
          }
        }
      });

      if (!avaliacao) {
        return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
      }

      // Buscar a assinatura eletrônica atrelada a esta avaliação
      const assinatura = await prisma.assinaturaEletronica.findFirst({
        where: {
          entidadeId: id,
          tipoDocumento: "AVALIACAO_INDIVIDUAL"
        }
      });

      if (!assinatura || !assinatura.hashAssinatura.startsWith("DOCUSIGN:")) {
        return NextResponse.json({ error: "Nenhum envelope DocuSign associado a esta avaliação." }, { status: 400 });
      }

      const envelopeId = assinatura.hashAssinatura.replace("DOCUSIGN:", "");

      const apiClient = await getDocusignClient();
      if (!apiClient) {
        return NextResponse.json({
          status: "simulado",
          message: "Credenciais do DocuSign ausentes. Emulação em modo local."
        });
      }

      const envelopesApi = new docusign.EnvelopesApi(apiClient);
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID || "";

      // Buscar o status real no DocuSign
      const envelopeInfo = await envelopesApi.getEnvelope(accountId, envelopeId);
      
      const statusReal = envelopeInfo.status === "completed" ? "CONCLUIDO" 
                       : envelopeInfo.status === "declined" ? "RECUSADO" 
                       : "PENDENTE";

      // Se o documento foi concluído e ainda não o baixamos
      // Podemos verificar se já foi baixado checando se documentoUrl já aponta para um arquivo '_assinado'
      // Mas por simplicidade, vamos baixar se for CONCLUIDO e atualizar. 
      // Para não baixar sempre, podemos verificar uma flag ou simplesmente se a string do hash mudou
      if (statusReal === "CONCLUIDO" && assinatura.ipAddress === "DocuSign API") {
        const docs = await downloadEnvelopeDocuments(envelopeId);
        
        if (docs && docs.length > 0) {
          // A avaliação tem apenas 1 documento
          const doc = docs[0];
          const filePath = `avaliacoes/${avaliacao.membro.bancaId}_${avaliacao.membro.usuarioId}_assinado_${Date.now()}.pdf`;
          
          const { url } = await uploadFile(doc.buffer, filePath);

          // Atualizar URL na Avaliação
          await prisma.avaliacao.update({
            where: { id },
            data: { documentoUrl: url }
          });

          // Atualizar o registro da assinatura para indicar que já baixamos e temos o documento físico
          await prisma.assinaturaEletronica.update({
            where: { id: assinatura.id },
            data: { 
              ipAddress: "DocuSign API - Baixado",
              // Opcional: poderíamos atualizar o hashAssinatura para o hash real do arquivo aqui
            }
          });
        }
      }

      return NextResponse.json({
        docusignEnvelopeId: envelopeId,
        statusAtual: statusReal,
        docusignStatusOriginal: envelopeInfo.status
      });

    } catch (error) {
      console.error("Erro ao buscar status da avaliação no DocuSign:", error);
      return NextResponse.json({ error: "Erro ao buscar status da avaliação." }, { status: 500 });
    }
  }
);
