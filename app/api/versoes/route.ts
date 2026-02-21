import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { uploadFile } from "@/app/lib/minio";
import { validateFileSize, validateFileType } from "@/app/config";
import { canUploadVersion } from "@/app/lib/trabalhoStateMachine";
import { getRequestMetadata } from "@/app/lib/requestMetadata";
import { createVersaoUrlSchema } from "@/app/lib/validationSchemas";
import { TipoDocumento } from "@prisma/client";

/**
 * GET /api/versoes?trabalhoId=<id>
 * Lista todas as versões de documento de um trabalho.
 * Requer autenticação. O usuário deve ter acesso ao trabalho.
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const trabalhoId = searchParams.get("trabalhoId");

    if (!trabalhoId) {
      return NextResponse.json({ error: "trabalhoId é obrigatório" }, { status: 400 });
    }

    const trabalho = await prisma.trabalho.findUnique({
      where: { id: trabalhoId },
    });

    if (!trabalho) {
      return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";
    const isOwner =
      trabalho.alunoId === user.userId || trabalho.orientadorId === user.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const versoes = await prisma.versaoDocumento.findMany({
      where: { trabalhoId },
      include: {
        uploadPor: {
          select: { id: true, nome: true, email: true },
        },
        comentarios: {
          select: { id: true },
        },
      },
      orderBy: { numeroVersao: "desc" },
    });

    return NextResponse.json(versoes);
  } catch (error) {
    console.error("Erro ao buscar versões:", error);
    return NextResponse.json({ error: "Erro ao buscar versões" }, { status: 500 });
  }
});

/**
 * POST /api/versoes
 * Cria uma nova versão de documento.
 * Aceita dois tipos de entrada:
 * 1. FormData com arquivo (upload para MinIO)
 * 2. JSON com URL externa (Google Docs, OneDrive, etc.)
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Determinar se é upload de arquivo ou URL externa
    const isFileUpload = contentType.includes("multipart/form-data");
    const isUrlSubmission = contentType.includes("application/json");

    if (!isFileUpload && !isUrlSubmission) {
      return NextResponse.json(
        {
          error:
            "Content-Type deve ser multipart/form-data (arquivo) ou application/json (URL)",
        },
        { status: 400 }
      );
    }

    let trabalhoId: string;
    let changelog: string | undefined;
    let tipoDocumento: TipoDocumento;
    let arquivoParaUpload: File | null = null;
    let dadosVersao: {
      nomeArquivo?: string;
      arquivoUrl?: string;
      tamanho?: number;
      mimeType?: string;
      urlExterna?: string;
      plataforma?: string;
      tituloDocumento?: string;
    };

    if (isFileUpload) {
      // === UPLOAD DE ARQUIVO ===
      const formData = await request.formData();
      const arquivo = formData.get("arquivo") as File;
      trabalhoId = formData.get("trabalhoId") as string;
      changelog = formData.get("changelog") as string;
      tipoDocumento = TipoDocumento.ARQUIVO;

      if (!arquivo) {
        return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
      }

      if (!trabalhoId) {
        return NextResponse.json({ error: "ID do trabalho não fornecido" }, { status: 400 });
      }

      const sizeValidation = validateFileSize(arquivo.size);
      if (!sizeValidation.valid) {
        return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
      }

      const typeValidation = validateFileType(arquivo.type);
      if (!typeValidation.valid) {
        return NextResponse.json({ error: typeValidation.error }, { status: 400 });
      }

      // Upload será feito após validações de permissão
      dadosVersao = {
        nomeArquivo: arquivo.name,
        mimeType: arquivo.type,
      };

      // Armazenar arquivo para upload posterior
      arquivoParaUpload = arquivo;
    } else {
      // === URL EXTERNA (Google Docs, OneDrive, etc.) ===
      const body = await request.json();
      const validated = createVersaoUrlSchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          { error: "Dados inválidos", details: validated.error.flatten() },
          { status: 400 }
        );
      }

      trabalhoId = validated.data.trabalhoId;
      changelog = validated.data.changelog;
      tipoDocumento = TipoDocumento.URL_EXTERNA;

      dadosVersao = {
        urlExterna: validated.data.urlExterna,
        plataforma: validated.data.plataforma,
        tituloDocumento: validated.data.tituloDocumento,
      };
    }

    // === VALIDAÇÕES COMUNS ===

    // Verificar se o usuário ainda existe no banco
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id: user.userId },
      select: { id: true },
    });

    if (!usuarioExiste) {
      return NextResponse.json(
        { error: "Sessão inválida. Faça login novamente." },
        { status: 401 }
      );
    }

    const trabalho = await prisma.trabalho.findUnique({
      where: { id: trabalhoId },
    });

    if (!trabalho) {
      return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
    }

    const isOwner = trabalho.alunoId === user.userId;
    const isOrientador = trabalho.orientadorId === user.userId;

    const uploadValidation = canUploadVersion(
      trabalho.status,
      user.role,
      isOwner,
      isOrientador
    );

    if (!uploadValidation.valid) {
      return NextResponse.json({ error: uploadValidation.error }, { status: 403 });
    }

    const ultimaVersao = await prisma.versaoDocumento.findFirst({
      where: { trabalhoId },
      orderBy: { numeroVersao: "desc" },
      select: { numeroVersao: true },
    });

    const numeroVersao = (ultimaVersao?.numeroVersao || 0) + 1;

    // Se for upload de arquivo, fazer upload para MinIO
    if (tipoDocumento === TipoDocumento.ARQUIVO && arquivoParaUpload) {
      const fileExtension = arquivoParaUpload.name.split(".").pop();
      const fileName = `${trabalhoId}_v${numeroVersao}.${fileExtension}`;
      const filePath = `trabalhos/${trabalhoId}/versoes/${fileName}`;

      const { url: arquivoUrl, size: tamanho } = await uploadFile(arquivoParaUpload, filePath);
      dadosVersao.arquivoUrl = arquivoUrl;
      dadosVersao.tamanho = tamanho;
    }

    const versao = await prisma.$transaction(async (tx) => {
      const novaVersao = await tx.versaoDocumento.create({
        data: {
          numeroVersao,
          tipoDocumento,
          nomeArquivo: dadosVersao.nomeArquivo,
          arquivoUrl: dadosVersao.arquivoUrl,
          tamanho: dadosVersao.tamanho,
          mimeType: dadosVersao.mimeType,
          urlExterna: dadosVersao.urlExterna,
          plataforma: dadosVersao.plataforma,
          tituloDocumento: dadosVersao.tituloDocumento,
          changelog: changelog || `Versão ${numeroVersao}`,
          trabalhoId,
          uploadPorId: user.userId,
        },
        include: {
          uploadPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      await tx.trabalho.update({
        where: {
          id: trabalhoId,
        },
        data: { versaoAtual: numeroVersao },
      });

      const { ipAddress, userAgent } = getRequestMetadata(request);

      await tx.auditLog.create({
        data: {
          usuarioId: user.userId,
          acao: tipoDocumento === TipoDocumento.ARQUIVO ? "UPLOAD_VERSAO" : "LINK_VERSAO",
          entidade: "VERSAO_DOCUMENTO",
          entidadeId: novaVersao.id,
          ipAddress,
          userAgent,
          detalhes: {
            trabalhoId,
            numeroVersao,
            tipoDocumento,
            ...(tipoDocumento === TipoDocumento.ARQUIVO
              ? { nomeArquivo: dadosVersao.nomeArquivo, tamanho: dadosVersao.tamanho }
              : { urlExterna: dadosVersao.urlExterna, plataforma: dadosVersao.plataforma }),
          },
        },
      });

      return novaVersao;
    });

    const notificacoes = [];

    if (user.userId !== trabalho.alunoId) {
      notificacoes.push({
        usuarioId: trabalho.alunoId,
        tipo: "NOVA_VERSAO",
        titulo: "Nova versão enviada",
        mensagem: `Uma nova versão (v${numeroVersao}) foi enviada para o trabalho "${trabalho.titulo}"`,
        link: `/trabalhos/${trabalhoId}`,
      });
    }

    if (user.userId !== trabalho.orientadorId) {
      notificacoes.push({
        usuarioId: trabalho.orientadorId,
        tipo: "NOVA_VERSAO",
        titulo: "Nova versão enviada",
        mensagem: `Uma nova versão (v${numeroVersao}) foi enviada para o trabalho "${trabalho.titulo}"`,
        link: `/trabalhos/${trabalhoId}`,
      });
    }

    if (notificacoes.length > 0) {
      await prisma.notificacao.createMany({
        data: notificacoes,
      });
    }

    return NextResponse.json({
      message: "Versão enviada com sucesso!",
      versao,
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json({ error: "Erro ao fazer upload da versão" }, { status: 500 });
  }
});
