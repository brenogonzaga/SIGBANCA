import { NextRequest, NextResponse } from "next/server";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { deleteFile } from "@/app/lib/minio";

/**
 * GET /api/versoes/[id]
 * Retorna os detalhes de uma versão específica.
 * Requer autenticação e acesso ao trabalho vinculado.
 */
export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = await context.params;

      const versao = await prisma.versaoDocumento.findUnique({
        where: { id },
        include: {
          trabalho: {
            select: {
              id: true,
              titulo: true,
              status: true,
              alunoId: true,
              orientadorId: true,
            },
          },
          uploadPor: {
            select: { id: true, nome: true, email: true },
          },
          comentarios: {
            include: {
              autor: {
                select: { id: true, nome: true, email: true },
              },
            },
            orderBy: { dataComentario: "asc" },
          },
        },
      });

      if (!versao) {
        return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
      }

      const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";
      const isOwner =
        versao.trabalho.alunoId === user.userId ||
        versao.trabalho.orientadorId === user.userId;

      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }

      return NextResponse.json(versao);
    } catch (error) {
      console.error("Erro ao buscar versão:", error);
      return NextResponse.json({ error: "Erro ao buscar versão" }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/versoes/[id]
 * Remove uma versão de documento.
 * Apenas COORDENADOR ou ADMIN podem excluir.
 * Não é permitido excluir a versão mais recente se houver versões anteriores
 * (o versaoAtual do trabalho ficaria inconsistente).
 */
export const DELETE = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = await context.params;

      if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Apenas coordenadores e administradores podem excluir versões" },
          { status: 403 }
        );
      }

      const versao = await prisma.versaoDocumento.findUnique({
        where: { id },
        include: { trabalho: true },
      });

      if (!versao) {
        return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
      }

      // Verificar se é a versão mais recente (não permitir excluir se for a atual ativa)
      const totalVersoes = await prisma.versaoDocumento.count({
        where: { trabalhoId: versao.trabalhoId },
      });

      if (totalVersoes === 1) {
        return NextResponse.json(
          { error: "Não é possível excluir a única versão de um trabalho" },
          { status: 400 }
        );
      }

      if (versao.numeroVersao === versao.trabalho.versaoAtual) {
        return NextResponse.json(
          {
            error:
              "Não é possível excluir a versão atual do trabalho. Defina outra versão como atual primeiro.",
          },
          { status: 400 }
        );
      }

      // Se houver arquivo no MinIO, remover
      if (versao.arquivoUrl) {
        try {
          const urlParts = versao.arquivoUrl.split("/");
          const bucketIndex = urlParts.findIndex((part) => part === "sigbanca-files");
          if (bucketIndex !== -1) {
            const filePath = urlParts.slice(bucketIndex + 1).join("/");
            await deleteFile(filePath);
          }
        } catch (minioError) {
          // Logar mas não bloquear a exclusão
          console.warn("Aviso: falha ao remover arquivo do MinIO:", minioError);
        }
      }

      // Excluir comentários associados e depois a versão
      await prisma.comentario.deleteMany({ where: { versaoId: id } });
      await prisma.versaoDocumento.delete({ where: { id } });

      return NextResponse.json({ message: "Versão excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir versão:", error);
      return NextResponse.json({ error: "Erro ao excluir versão" }, { status: 500 });
    }
  }
);
