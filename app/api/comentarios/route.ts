import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";
import { createComentarioSchema } from "@/app/lib/validationSchemas";
import { z } from "zod";

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { texto, versaoId, parentId } = createComentarioSchema.parse(body);

    const versao = await prisma.versaoDocumento.findUnique({
      where: { id: versaoId },
      include: {
        trabalho: true,
      },
    });

    if (!versao) {
      return NextResponse.json(
        { error: "Versão do documento não encontrada" },
        { status: 404 }
      );
    }

    const canComment =
      user.role === "ADMIN" ||
      user.role === "COORDENADOR" ||
      versao.trabalho.alunoId === user.userId ||
      versao.trabalho.orientadorId === user.userId;

    if (!canComment) {
      return NextResponse.json(
        { error: "Você não tem permissão para comentar neste trabalho" },
        { status: 403 }
      );
    }

    const comentario = await prisma.comentario.create({
      data: {
        texto,
        versaoId,
        autorId: user.userId,
        parentId,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(comentario, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao criar comentário:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao criar comentário" }, { status: 500 });
  }
});
