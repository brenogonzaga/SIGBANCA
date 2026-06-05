import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { getDocusignClient } from "@/app/lib/docusign";
import docusign from "docusign-esign";

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      const banca = await prisma.banca.findUnique({
        where: { id },
      });

      if (!banca) {
        return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
      }

      if (!banca.docusignEnvelopeId) {
        return NextResponse.json({ error: "Nenhum envelope DocuSign associado a esta banca." }, { status: 400 });
      }

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
      const envelopeInfo = await envelopesApi.getEnvelope(accountId, banca.docusignEnvelopeId);
      
      const statusReal = envelopeInfo.status === "completed" ? "CONCLUIDO" 
                       : envelopeInfo.status === "declined" ? "RECUSADO" 
                       : "PENDENTE";

      // Atualizar no banco de dados se houver mudança
      if (banca.statusAssinatura !== statusReal) {
        let ataPdfUrl = banca.ataPdfUrl;
        let fichaGeralPdfUrl = banca.fichaGeralPdfUrl;
        let termoAprovacaoPdfUrl = banca.termoAprovacaoPdfUrl;

        // Se foi concluído, vamos baixar os documentos assinados e atualizar os links
        if (statusReal === "CONCLUIDO") {
          const { downloadEnvelopeDocuments } = await import("@/app/lib/docusign");
          const { uploadFile } = await import("@/app/lib/minio");

          const docs = await downloadEnvelopeDocuments(banca.docusignEnvelopeId);
          if (docs && docs.length > 0) {
            for (const doc of docs) {
              // Os documentos foram adicionados na ordem: 1 (Ata), 2 (Ficha Geral), 3 (Termo)
              const filePath = `bancas/${id}/${doc.name.replace('.pdf', '')}_assinado_${Date.now()}.pdf`;
              const { url } = await uploadFile(doc.buffer, filePath);

              if (doc.documentId === "1") ataPdfUrl = url;
              if (doc.documentId === "2") fichaGeralPdfUrl = url;
              if (doc.documentId === "3") termoAprovacaoPdfUrl = url;
            }
          }
        }

        await prisma.banca.update({
          where: { id },
          data: { 
            statusAssinatura: statusReal,
            ...(statusReal === "CONCLUIDO" ? {
              ataPdfUrl,
              fichaGeralPdfUrl,
              termoAprovacaoPdfUrl
            } : {})
          }
        });
      }

      return NextResponse.json({
        docusignEnvelopeId: banca.docusignEnvelopeId,
        statusAtual: statusReal,
        docusignStatusOriginal: envelopeInfo.status
      });

    } catch (error) {
      console.error("Erro ao buscar status no DocuSign:", error);
      return NextResponse.json({ error: "Erro ao buscar status das assinaturas." }, { status: 500 });
    }
  }
);
