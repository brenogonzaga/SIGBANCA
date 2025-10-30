import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { uploadFile } from "@/app/lib/minio";
import { validateFileSize, validateFileType } from "@/app/config";

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo") as File;
    const trabalhoId = formData.get("trabalhoId") as string;
    const changelog = formData.get("changelog") as string;

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

    const trabalho = await prisma.trabalho.findUnique({
      where: { id: trabalhoId },
    });

    if (!trabalho) {
      return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
    }

    const canUpload =
      user.role === "ADMIN" ||
      user.role === "COORDENADOR" ||
      trabalho.alunoId === user.userId ||
      trabalho.orientadorId === user.userId;

    if (!canUpload) {
      return NextResponse.json(
        { error: "Você não tem permissão para enviar versões deste trabalho" },
        { status: 403 }
      );
    }

    const versaoCount = await prisma.versaoDocumento.count({
      where: { trabalhoId },
    });

    const numeroVersao = versaoCount + 1;

    const fileExtension = arquivo.name.split(".").pop();
    const fileName = `${trabalhoId}_v${numeroVersao}.${fileExtension}`;
    const filePath = `trabalhos/${trabalhoId}/versoes/${fileName}`;

    const { url: arquivoUrl, size: tamanho } = await uploadFile(arquivo, filePath);

    const versao = await prisma.versaoDocumento.create({
      data: {
        numeroVersao,
        nomeArquivo: arquivo.name,
        arquivoUrl,
        tamanho,
        mimeType: arquivo.type,
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

    await prisma.trabalho.update({
      where: { id: trabalhoId },
      data: { versaoAtual: numeroVersao },
    });

    return NextResponse.json({
      message: "Versão enviada com sucesso!",
      versao,
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json({ error: "Erro ao fazer upload da versão" }, { status: 500 });
  }
});
