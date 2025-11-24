import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const apenasNaoLidas = searchParams.get("naoLidas") === "true";

    const skip = (page - 1) * limit;

    const where = {
      usuarioId: user.userId,
      ...(apenasNaoLidas ? { lida: false } : {}),
    };

    const [notificacoes, total, naoLidas] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.notificacao.count({ where }),
      prisma.notificacao.count({
        where: { usuarioId: user.userId, lida: false },
      }),
    ]);

    return NextResponse.json({
      notificacoes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      naoLidas,
    });
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ error: "Erro ao buscar notificações" }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { ids, marcarTodasComoLidas } = body;

    if (marcarTodasComoLidas) {
      await prisma.notificacao.updateMany({
        where: {
          usuarioId: user.userId,
          lida: false,
        },
        data: {
          lida: true,
        },
      });

      return NextResponse.json({
        message: "Todas as notificações foram marcadas como lidas",
      });
    }

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "IDs de notificações inválidos" }, { status: 400 });
    }

    await prisma.notificacao.updateMany({
      where: {
        id: { in: ids },
        usuarioId: user.userId,
      },
      data: {
        lida: true,
      },
    });

    return NextResponse.json({
      message: "Notificações marcadas como lidas",
    });
  } catch (error) {
    console.error("Erro ao atualizar notificações:", error);
    return NextResponse.json({ error: "Erro ao atualizar notificações" }, { status: 500 });
  }
});


export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const notificacao = await prisma.notificacao.findUnique({
        where: { id },
      });

      if (!notificacao) {
        return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
      }

      if (notificacao.usuarioId !== user.userId) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }

      await prisma.notificacao.delete({
        where: { id },
      });

      return NextResponse.json({
        message: "Notificação excluída com sucesso",
      });
    }

    await prisma.notificacao.deleteMany({
      where: {
        usuarioId: user.userId,
        lida: true,
      },
    });

    return NextResponse.json({
      message: "Notificações lidas excluídas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir notificações:", error);
    return NextResponse.json({ error: "Erro ao excluir notificações" }, { status: 500 });
  }
});
