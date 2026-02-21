import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";
import { createComentarioSchema, updateComentarioSchema } from "@/app/lib/validationSchemas";
import { z } from "zod";

/**
 * GET /api/comentarios?versaoId=<id>
 * Lista os comentários de uma versão de documento.
 * Requer autenticação. O usuário deve ter acesso ao trabalho.
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const versaoId = searchParams.get("versaoId");

    if (!versaoId) {
      return NextResponse.json({ error: "versaoId é obrigatório" }, { status: 400 });
    }

    const versao = await prisma.versaoDocumento.findUnique({
      where: { id: versaoId },
      include: { trabalho: true },
    });

    if (!versao) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
    }

    // Verificar acesso: aluno dono, orientador, admin ou coordenador
    const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";
    const isOwner =
      versao.trabalho.alunoId === user.userId ||
      versao.trabalho.orientadorId === user.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const comentarios = await prisma.comentario.findMany({
      where: {
        versaoId,
        parentId: null, // Apenas comentários raiz; respostas vêm aninhadas
      },
      include: {
        autor: {
          select: { id: true, nome: true, email: true, role: true },
        },
        respostas: {
          include: {
            autor: {
              select: { id: true, nome: true, email: true, role: true },
            },
          },
          orderBy: { dataComentario: "asc" },
        },
      },
      orderBy: { dataComentario: "asc" },
    });

    return NextResponse.json(comentarios);
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    return NextResponse.json({ error: "Erro ao buscar comentários" }, { status: 500 });
  }
});

/**
 * POST /api/comentarios
 * Cria um novo comentário em uma versão de documento.
 */
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

    // Se é resposta, verificar que o comentário pai existe e pertence à mesma versão
    if (parentId) {
      const parent = await prisma.comentario.findUnique({ where: { id: parentId } });
      if (!parent || parent.versaoId !== versaoId) {
        return NextResponse.json(
          { error: "Comentário pai inválido" },
          { status: 400 }
        );
      }
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

    // Notificar o autor da versão se não for o mesmo que comentou
    if (versao.uploadPorId !== user.userId) {
      await prisma.notificacao.create({
        data: {
          usuarioId: versao.uploadPorId,
          tipo: "COMENTARIO",
          titulo: "Novo comentário",
          mensagem: `${user.nome || "Alguém"} comentou na versão ${versao.numeroVersao} do trabalho "${versao.trabalho.titulo}".`,
          link: `/trabalhos/${versao.trabalhoId}?versao=${versao.id}`,
        },
      });
    }

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

/**
 * PUT /api/comentarios?id=<id>
 * Edita o texto de um comentário. Apenas o autor pode editar.
 */
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do comentário é obrigatório" }, { status: 400 });
    }

    const body = await request.json();
    const { texto } = updateComentarioSchema.parse(body);

    const comentario = await prisma.comentario.findUnique({ where: { id } });

    if (!comentario) {
      return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
    }

    if (comentario.autorId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas o autor pode editar o comentário" },
        { status: 403 }
      );
    }

    const atualizado = await prisma.comentario.update({
      where: { id },
      data: { texto },
      include: {
        autor: { select: { id: true, nome: true, email: true } },
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Erro ao editar comentário:", error);
    return NextResponse.json({ error: "Erro ao editar comentário" }, { status: 500 });
  }
});

/**
 * DELETE /api/comentarios?id=<id>
 * Remove um comentário. Apenas o autor ou admin/coordenador pode excluir.
 */
export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do comentário é obrigatório" }, { status: 400 });
    }

    const comentario = await prisma.comentario.findUnique({ where: { id } });

    if (!comentario) {
      return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
    }

    const isAutor = comentario.autorId === user.userId;
    const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";

    if (!isAutor && !isAdmin) {
      return NextResponse.json(
        { error: "Sem permissão para excluir este comentário" },
        { status: 403 }
      );
    }

    // Excluir respostas também (cascade não garantido em SQLite)
    await prisma.comentario.deleteMany({ where: { parentId: id } });
    await prisma.comentario.delete({ where: { id } });

    return NextResponse.json({ message: "Comentário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir comentário:", error);
    return NextResponse.json({ error: "Erro ao excluir comentário" }, { status: 500 });
  }
});
