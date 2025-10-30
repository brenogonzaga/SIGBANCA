import { NextRequest, NextResponse } from "next/server";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { getDownloadUrl } from "@/app/lib/minio";

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = await context.params;

      const versao = await prisma.versaoDocumento.findUnique({
        where: { id },
        include: {
          trabalho: true,
        },
      });

      if (!versao) {
        return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
      }

      const urlParts = versao.arquivoUrl.split("/");
      const bucketIndex = urlParts.findIndex((part) => part === "sigbanca-files");
      const filePath = urlParts.slice(bucketIndex + 1).join("/");

      const downloadUrl = await getDownloadUrl(filePath, 3600);

      return NextResponse.json({
        id: versao.id,
        nomeArquivo: versao.nomeArquivo,
        downloadUrl,
        mimeType: versao.mimeType,
        tamanho: versao.tamanho,
        expiresIn: 3600,
      });
    } catch (error) {
      console.error("Erro ao obter download:", error);
      return NextResponse.json({ error: "Erro ao obter download" }, { status: 500 });
    }
  }
);
